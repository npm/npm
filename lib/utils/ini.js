// Create a chain of config objects, in this priority order:
//
// CLI - the --foo things in the command line.
// ENV - all the things starting with npm_config_ in the environment
// USER - $HOME/.npmrc
// GLOBAL - $PREFIX/etc/npmrc
//
// If the CLI or ENV specify a userconfig, then that file is used
// as the USER config.
//
// If the CLI or ENV specify a globalconfig, then that file is used
// as the GLOBAL config.
//
// export npm_config_userconfig=/some/other/file
// export npm_config_globalconfig=global
//
// For implementation reasons, "_" in env vars is turned into "-". So,
// export npm_config_auto_activate

exports.resolveConfigs = resolveConfigs
exports.save = save
exports.del = del
exports.get = get
exports.set = set
exports.unParseField = unParseField

Object.defineProperty(exports, "keys",
  { get : function () { return configList.keys }})

var fs = require("./graceful-fs")
  , path = require("path")
  , http = require("http")
  , sys = require("sys")
  , crypto = require("crypto")

  , privateKey = null
  , mkdir = require("./mkdir-p")
  , chain = require("./chain")
  , log = require("./log")
  , ini = require("./ini-parser")
  , base64 = require("./base64")
  , ProtoList = require("./proto-list")
  , defaultConfig = require("./default-config")
  , configList = new ProtoList()
  , TRANS =
    { "default" : 4
    , "global" : 3
    , "user" : 2
    , "env" : 1
    , "cli" : 0
    }
  , isSudo = process.getuid() === 0

configList.push(defaultConfig)
function resolveConfigs (cli, cb) {
  var cl = configList
    , dc = cl.pop()
  if (!cb) cb = cli, cli = {}
  cl.list.length = 0
  Object.keys(cli).forEach(function (k) {
    cli[k] = parseField(cli[k], k.match(/root$/i))
  })
  cl.push(cli)
  cl.push(parseEnv(process.env))
  parseFile(cl.get("userconfig") || dc.userconfig, function (er, conf) {
    if (er) return cb(er)
    cl.push(conf)
    parseFile(cl.get("globalconfig") || dc.globalconfig, function (er, conf) {
      if (er) return cb(er)
      cl.push(conf)
      cl.push(dc)
      // make sure that the root folder exists
      // This is a bit of a kludge, but until we can abstract out
      // file read/write in a clean way, this is the only single
      // gateway where we can ensure that these folders exist.
      var npmdir = path.join(cl.get("root"), ".npm")
      chain
        ( cl.get("binroot") && [mkdir, cl.get("binroot")]
        , [mkdir, path.join(npmdir, ".tmp")]
        , [mkdir, path.join(npmdir, ".cache")]
        , function (er) {
            exports.resolved = true
            cb(er)
          }
        )
    })
  })
}
function parseEnv (env) {
  var conf = {}
  Object.keys(env)
    .filter(function (k) { return k.match(/^npm_config_[^_]/i) })
    .forEach(function (k) {
      conf[k.replace(/^npm_config_/i, "")
            .toLowerCase()
            .replace(/_/g, "-")] = parseField(env[k], k.match(/root$/i))
    })
  return conf
}
function unParseField (f, isPath) {
  if (isPath && !isSudo) {
    if (process.env.HOME.substr(-1) === "/") {
      process.env.HOME = process.env.HOME(0, process.env.HOME.length-1)
    }
    if (f.indexOf(process.env.HOME) === 0) {
      f = "~"+f.substr(process.env.HOME.length)
    }
  }
  return f
}
function parseField (f, isPath) {
  f = (""+f).trim()
  if (f === "") f = true
  if (isPath) {
    if (f.substr(0, 2) === "~/" && process.env.HOME) {
      f = path.join(process.env.HOME, f.substr(2))
    }
    if (f.substr(0, 2) === "./") {
      f = path.join(process.cwd(), f.substr(2))
    }
  }
  switch (f) {
    case "true": f = true; break
    case "false": f = false; break
    case "null": f = null; break
    case "undefined": f = undefined; break
  }
  return f
}
function parseFile (file, cb) {
  if (!file) return cb(null, {})
  log.verbose(file, "config file")
  fs.readFile(file, function (er, data) {
    if (er) return cb(null, {})
    var d = ini.parse(""+data)["-"]
      , f = {}
    Object.keys(d).forEach(function (k) {
      var isPath = k.match(/root$/i)
      // ignore ~/ paths in config files when acting as root.
      if (isSudo && isPath && d[k].substr(0, 2) === "~/") {
        log.warn("ignoring '"+k+" = "+d[k]+"' ("+file+")", "sudo")
        return
      }
      f[k] = parseField(d[k], isPath)
    })
    decryptAuth(f, cb)
  })
}
function decryptAuth (config, cb) {
  // todo: remove the _ kludgery in 1.0.0
  var proto = config.__proto__
  config.__proto__ = {}
  if (config.password) config._password = config.password
  if (config.authCrypt) config._authCrypt = config.authCrypt
  delete config.password
  delete config.authCrypt
  if (!config._authCrypt || !crypto.Decipher) {
    config.__proto__ = proto
    return cb(null, config)
  }
  getKey(function (er, key) {
    if (er) return log(er, "error getting key to decrypt auth", cb)
    if (!key) return log("Could not get key", "error decrypting auth", cb)
    var c = (new crypto.Decipher).init("aes192", key)
    config._auth = c.update(config._authCrypt, "hex", "utf8")
    config._auth += c.final("utf8")
    delete config._authCrypt
    var unpw = base64.decode(config._auth).split(":")
    config.username = unpw[0] = (config.username || unpw[0])
    config._password = unpw[1] = (config._password || unpw[1])
    config._auth = base64.encode(unpw.join(":"))
    config.__proto__ = proto
    cb(null, config)
  })
}
function encryptAuth (config, cb) {
  var proto = config.__proto__
  config.__proto__ = {}
  // todo: remove the _ kludgery in 1.0.0
  if (config.password) config._password = config.password
  if (config.auth) config._auth = config.authCrypt
  delete config.password
  delete config.auth
  var auth = config._auth ? base64.decode(config._auth) : null
  if (config.username && config._password && !auth) {
    auth = config.username+":"+config._password
  }
  if (!auth || !crypto.Cipher) {
    config.__proto__ = proto
    return cb(null, config)
  }
  var unpw = auth.split(":")
  config.username = unpw[0] = config.username || unpw[0]
  config._password = unpw[1] = config._password || unpw[1]
  auth = unpw.join(":")
  config._auth = base64.encode(auth)
  getKey(function (er, key) {
    if (er) return log(er, "error getting key to encrypt auth", cb)
    if (!key) return log("Could not get key", "error encrypting auth", cb)
    var c = (new crypto.Cipher).init("aes192", key)
    config._authCrypt = c.update(config._auth, "utf8", "hex")
    config._authCrypt += c.final("hex")
    delete config._auth
    delete config.username
    delete config._password
    config.__proto__ = proto
    cb(null, config)
  })
}
function getKey (cb) {
  if (privateKey) return cb(null, privateKey)
  var ssh = path.join(process.env.HOME, ".ssh")
    , keys = [ path.join(ssh, "id_dsa")
             , path.join(ssh, "id_rsa")
             , path.join(ssh, "identity")
             ]
  ;(function K (k) {
    if (!k) return cb(null, false)
    fs.readFile(k, function (er, data) {
      if (er) return K(keys.shift())
      return cb(null, data+"")
    })
  })(keys.shift())
}

function save (cb) {
  return saveConfig("global", function (er) { saveConfig("user", cb) })
}
function saveConfig (which, cb) {
  if (which !== "global") which = "user"
  saveConfigfile
    ( configList.get(which + "config")
    , configList.list[TRANS[which]]
    , cb
    )
}
function saveConfigfile (file, config, cb) {
  encryptAuth(config, function () { // ignore errors
    var data = {}
    Object.keys(config).forEach(function (k) {
      data[k] = unParseField(config[k], k.match(/root$/i))
    })
    data = ini.stringify({"-":data}).trim()
    return (data) ? writeConfigfile(file, data+"\n", cb)
                  : rmConfigfile(file, cb)
  })
}
function writeConfigfile (configfile, data, cb) {
  fs.writeFile
    ( configfile, data, "utf8"
    , function (er) {
        if (er) log(er, "Failed saving "+configfile)
        cb()
      }
    )
}
function rmConfigfile (configfile, cb) {
  fs.stat(configfile, function (e) {
    if (e) return cb()
    fs.unlink(configfile, function (er) {
      if (er) log(er, "Couldn't remove "+configfile)
      cb()
    })
  })
}
function snapshot (which) {
  return (!which) ? configList.snapshot
       : configList.list[TRANS[which]] ? configList.list[TRANS[which]]
       : undefined
}
function get (key, which) {
  return (!key) ? snapshot(which)
       : (!which) ? configList.get(key) // resolved
       : configList.list[TRANS[which]] ? configList.list[TRANS[which]][key]
       : undefined
}
function del (key, which) {
  if (!which) configList.list.forEach(function (l) {
    delete l[key]
  })
  else if (configList.list[TRANS[which]]) {
    delete configList.list[TRANS[which]]
  }
}
function set (key, value, which) {
  which = which || "cli"
  if (configList.length === 1) {
    throw new Error("trying to set before loading")
  }
  return configList.list[TRANS[which]][key] = value
}
