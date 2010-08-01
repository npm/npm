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
exports.config = config
exports.save = save
exports.del = del
exports.get = get
exports.set = set

var fs = require("fs")
  , path = require("path")
  , http = require("http")
  , sys = require("sys")
  , crypto = require("crypto")

  , privateKey = null
  , log = require("./log")
  , ini = require("./ini-parser")
  , base64 = require("./base64")
  , ProtoList = require("./proto-list")
  , defaultConfig = require("./default-config")
  , configList = new ProtoList()
  , TRANS =
    { "default" : 0
    , "global" : 1
    , "user" : 2
    , "env" : 3
    , "cli" : 4
    }

function resolveConfigs (cli, cb) {
  var cl = configList
    , dc = defaultConfig
  if (!cb) cb = cli, cli = null
  if (cli) cl.unshift(cli)
  cl.unshift(parseEnv(process.env))
  parseFile(cl.get("userconfig") || dc.userconfig, function (er, conf) {
    if (er) return cb(er)
    cl.unshift(conf)
    parseFile(cl.get("globalconfig") || dc.globalconfig, function (er, conf) {
      if (er) return cb(er)
      cl.unshift(conf)
      cl.unshift(dc)
      cb(null, configList)
    })
  })
}
function parseEnv (env) {
  var conf = {}
  Object.keys(env)
    .filter(function (k) { return k.match(/^npm_config_[^_]/) })
    .forEach(function (k) {
      conf[k.replace(/^npm_config_/, "")
            .toLowerCase()
            .replace(/_/g, "-")] = parseField(env[k])
    })
  return conf
}
function parseField (f) {
  f = f.trim()
  if (f === "true" || f === "false" || f === "null" || f === "undefined") {
    return JSON.parse(f)
  }
  return f
}
function parseFile (file, cb) {
  fs.readFile(file, function (er, data) {
    if (er) {
      log(er, "Error reading configfile: "+file)
      return cb(null, {})
    }
    var d = ini.parse(""+data)["-"]
    Object.keys(d).forEach(function (k) { d[k] = parseField(d[k]) })
    decryptAuth(d, cb)
  })
}
function decryptAuth (config, cb) {
  // todo: remove in 1.0.0
  if (config.password) config._password = config.password
  if (config.authCrypt) config._authCrypt = config.authCrypt
  delete config.password
  delete config.authCrypt
  if (!config._authCrypt || !crypto.Decipher) return cb(null, config)
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
    cb(null, config)
  })
}
function encryptAuth (config, cb) {
  // todo: remove in 1.0.0
  if (config.password) config._password = config.password
  if (config.auth) config._auth = config.authCrypt
  delete config.password
  delete config.auth
  var auth = config._auth ? base64.decode(config._auth) : null
  if (config.username && config._password && !auth) {
    auth = config.username+":"+config._password
  }
  if (!auth || !crypto.Cipher) return
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
  if (cb) {
    return saveConfig("global", function (er) { saveConfig("user", cb) })
  }
  saveConfig("global")
  saveConfig("user")
}
function saveConfig (which, cb) {
  if (which !== "global") which = "user"
  saveConfigfile
    ( configList.get(which + "config")
    , configList[TRANS[which]]
    , cb
    )
}
function saveConfigfile (file, config, cb) {
  encryptAuth(config, function () { // ignore errors
    var proto = config.__proto__
    config.__proto__ = {}
    var data = ini.stringify({"-":config}).trim()
    config.__proto__ = proto
    return (data) ? writeConfigfile(configfile, data, cb)
                  : rmConfigfile(configfile, cb)
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
function get (key, which) {
  return (!which) ? configList.get(key) // resolved
       : configList[TRANS[which]] ? configList[TRANS[which]][key]
       : undefined
}
function del (key, which) {
  if (!which) configList.list.forEach(function (l) {
    delete l[key]
  }) else if (configList[TRANS[which]]) {
    delete configList[TRANS[which]]
  }    
}
function set (key, value, which) {
  which = which || "cli"
  return configList[TRANS[which]][key] = value
}
