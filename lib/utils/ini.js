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
  , sys = require("./sys")
  , crypto = require("crypto")

  , privateKey = null
  , chain = require("./chain")
  , log = require("./log")
  , ini = require("./ini-parser")
  , base64 = require("./base64")
  , ProtoList = require("./proto-list")
  , defaultConfig
  , configList = new ProtoList()
  , parseArgs = require("./parse-args")
  , TRANS =
    { "default" : 4
    , "global" : 3
    , "user" : 2
    , "env" : 1
    , "cli" : 0
    }

exports.configList = configList
configList.push({loglevel:"info"})
function resolveConfigs (cli, cb) {
  defaultConfig = defaultConfig || require("./default-config")
  configList.pop()
  configList.push(defaultConfig)
  var cl = configList
    , dc = cl.pop()
  if (!cb) cb = cli, cli = {}
  cl.list.length = 0
  Object.keys(cli).forEach(function (k) {
    cli[k] = parseField(cli[k], k)
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
      exports.resolved = true
      cb()
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
            .replace(/_/g, "-")] = parseField(env[k], k)
    })
  return conf
}

function unParseField (f, k) {
  // type can be an array or single thing.
  var isPath = -1 !== [].concat(parseArgs.types[k]).indexOf(path)
  if (isPath) {
    if (typeof process.env.HOME !== 'undefined') {
      if (process.env.HOME.substr(-1) === "/") {
        process.env.HOME = process.env.HOME(0, process.env.HOME.length-1)
      }
      if (f.indexOf(process.env.HOME) === 0) {
        f = "~"+f.substr(process.env.HOME.length)
      }
    }
  }
  return f
}

function parseField (f, k) {
  if (typeof f !== "string" && !(f instanceof String)) return f
  // type can be an array or single thing.
  var isPath = -1 !== [].concat(parseArgs.types[k]).indexOf(path)
  f = (""+f).trim()
  if (f === "") f = true
  if (isPath) {
    if (f.substr(0, 2) === "~/" && process.env.HOME) {
      f = path.join(process.env.HOME, f.substr(2))
    }
    if (f.charAt(0) !== "/") {
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
      f[k] = parseField(d[k], k)
    })
    decryptAuth(f, cb)
  })
}

function decryptAuth (config, cb) {
  if (!config._authCrypt || !crypto.Decipher) {
    config.__proto__ = proto
    return cb(null, parseAuth(config))
  }
  var proto = config.__proto__
  config.__proto__ = {}
  getKey(function (er, key) {
    if (er) return log(er, "error getting key to decrypt auth", cb)
    if (!key) return log("Could not get key", "error decrypting auth", cb)
    var c = (new crypto.Decipher).init("aes192", key)
    config._auth = c.update(config._authCrypt, "hex", "utf8")
    config._auth += c.final("utf8")
    delete config._authCrypt
    config.__proto__ = proto
    cb(null, parseAuth(config))
  })
}

function encryptAuth (config, cb) {
  if (config.username && config._password) {
    config._auth = base64.encode(config.username+":"+config._password)
  }
  delete config.username
  delete config._password
  return cb(null, config)
}

function parseAuth (config) {
  if (!config._auth) return config
  var unpw = base64.decode(config._auth).split(":")
    , un = unpw.shift()
    , pw = unpw.join(":")
  config.username = un = (config.username || un)
  config._password = pw = (config._password || pw)
  config._auth = base64.encode(un + ":" + pw)
  return config
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
      return cb(null, privateKey = data+"")
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
    , which === "user" ? 0600 : 0644
    , function (er) {
        if (er || which !== "user" || !process.getuid) return cb(er)
        var uid = process.env.SUDO_UID !== undefined
                ? process.env.SUDO_UID : process.getuid()
          , gid = process.env.SUDO_GID !== undefined
                ? process.env.SUDO_GID : process.getgid()
        fs.chown(configList.get(which + "config"), +uid, +gid, cb)
      } )
}

function saveConfigfile (file, config, mode, cb) {
  encryptAuth(config, function () { // ignore errors
    var data = {}
    Object.keys(config).forEach(function (k) {
      data[k] = unParseField(config[k], k)
    })
    data = ini.stringify({"-":data}).trim()
    return (data) ? writeConfigfile(file, data+"\n", mode, cb)
                  : rmConfigfile(file, cb)
  })
}
function writeConfigfile (configfile, data, mode, cb) {
  fs.writeFile
    ( configfile, data, "utf8"
    , function (er) {
        if (er) log(er, "Failed saving "+configfile, cb)
        else if (mode) fs.chmod(configfile, mode, cb)
        else cb()
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
  var x = (!which) ? configList.snapshot
        : configList.list[TRANS[which]] ? configList.list[TRANS[which]]
        : undefined
  if (!x) return
  Object.keys(x).forEach(function (k) { if (k.match(/^_/)) delete x[k] })
  return x
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
    return new Error("trying to set before loading")
  }
  return configList.list[TRANS[which]][key] = value
}
