
// TODO: Merge from other places, make locations configurable.
// Should look in {installPrefix}/etc/npmrc first by default,
// and then env.HOME/.npmrc for overrides.


/*

Create a chain of config objects, in this priority order:

CLI - the --foo things in the command line.
ENV - all the things starting with npm_config_ in the environment
USER - $HOME/.npmrc
GLOBAL - $PREFIX/etc/npmrc

If the CLI or ENV specify a userconfig, then that file is used
as the USER config.

If the CLI or ENV specify a globalconfig, then that file is used
as the GLOBAL config.

export npm_config_userconfig=/some/other/file
export npm_config_globalconfig=global

For implementation reasons, "_" in env vars is turned into "-". So,
export npm_config_auto_activate

*/
exports.resolveConfigs = resolveConfigs
exports.config = config
exports.save = save
exports.del = del
exports.get = get
exports.set = set

var ProtoList = require("./proto-list")
  , fs = require("fs")
  , configList = new ProtoList()
  , defaultConfig = require("./default-config")
  , ini = require("./ini-parser")

function resolveConfigs (cli, cb) {
  var cl = configList
    , dc = defaultConfig
  cl.unshift(cli)
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
    .filter(function (k) { return k.match(/^npm_config_/) })
    .forEach(function (k) {
      conf[k.replace(/^npm_config_/, "")
            .toLowerCase()
            .replace("_", "-")] = env[k]
    })
  return conf
}
function parseFile (file, cb) {
  fs.readFile(file, function (er, data) {
    if (er) log(er, "Error reading configfile: "+file)
    return cb(null, er ? {} : decryptAuth(ini.parse(""+data)["-"]))
  })
}
function save (cb) {
  if (cb) {
    return saveConfig("global", function (er) { saveConfig("user", cb) })
  }
  saveConfig("global")
  saveConfig("user")
}
function saveConfig (which, cb) {
  var cl = configList
    , g = configList[1]
    , u = configList[2]
    , conf = (which === "global") g : u
    , file = cl.get((which === "global") ? "globalconfig" : "userconfig")
  saveConfigfile(file, conf, cb)
}
function saveConfigfile (file, config, cb) {
  encryptAuth(config)
  var proto = config.__proto__
  config.__proto__ = {}
  var data = ini.stringify({"-":config}).trim()
  config.__proto__ = proto
  return (data) ? writeConfigfile(configfile, data, cb)
                : rmConfigfile(configfile, cb)
}
function writeConfigfile (configfile, data, cb) {
  try {
    return fs[cb?"writeFile":"writeFileSync"]
      ( configfile
      , data
      , "utf8"
      , function (er) {
          if (er) log(er, "Couldn't save "+configfile)
          cb()
        }
      )
  } catch (er) { if (er) log(er, "Couldn't save "+configfile) }
}
function rmConfigfile (configfile, cb) {
  if (!cb) return rmConfigfileSync(configfile)
  fs.stat(configfile, function (e) {
    if (e) return cb()
    fs.unlink(configfile, function (er) {
      if (er) log(er, "Couldn't remove "+configfile)
      cb()
    })
  })
}
function rmConfigfileSync (configfile) {
  try { fs.statSync(configfile) }
  catch (ex) { return }
  try { return fs.unlinkSync(configfile) }
  catch (er) { log(er, "Couldn't remove "+configfile) }
}

var TRANS =
  { "default" : 0
  , "global" : 1
  , "user" : 2
  , "env" : 3
  , "cli" : 4
  }
  
function get (key, which) {
  return (!which) ? configList.get(key) // resolved
       : configList[TRANS[which]] ? configList[TRANS[which]][key]
       : undefined
}
function del (key, which) {
  
}

///////////////////////////////////////////////

var fs = require("fs")
  , path = require("path")
  , http = require("http")
  , log = require("./log")
  , ini = require("./ini-parser")
  , sys = require("sys")
  , hasSSL = false
  , crypto
  , base64 = require("./base64")

try {
  crypto = process.binding("crypto") && require("crypto")
  hasSSL = true
} catch (ex) {
  crypto = require("crypto")
}





var defaultConfig = require("./default-config")
  , configfile = path.existsSync(defaultConfig.configFile)
               ? defaultConfig.configFile
               : path.join(process.env.HOME, ".npmrc")
  , config = getConfig() || {}
  , privateKey

exports.config = config
exports.save = save
exports.del = del
exports.get = get
exports.set = set

function getConfig () {
  // TODO: --config <path> on the cli to set this.
  var config
  log(configfile, "configfile")
  try {
    config = "" + fs.readFileSync(configfile)
    config = ini.parse(config)["-"]
  } catch (ex) {
    config = {}
  }
  config.__proto__ = defaultConfig

  decryptAuth(config)
  return config
}

function getKey () {
  if (privateKey) return privateKey
  var ssh = path.join(process.env.HOME, ".ssh")
    , keys = [ path.join(ssh, "id_dsa")
             , path.join(ssh, "id_rsa")
             , path.join(ssh, "identity")
             ]
  for (var i = 0, l = keys.length; i < l; i ++) {
    try {
      return (privateKey = "" + fs.readFileSync(keys[i]))
    } catch (e) {}
  }
  return false
}
function encryptAuth (config) {
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
  var key = getKey()
  if (key === false) return undefined
  var c = (new crypto.Cipher).init("aes192", key)
  config._authCrypt = c.update(config._auth, "utf8", "hex")
  config._authCrypt += c.final("hex")
  delete config._auth
  delete config.username
  delete config._password
  return config
}
function decryptAuth (config) {
  // todo: remove in 1.0.0
  if (config.password) config._password = config.password
  if (config.authCrypt) config._authCrypt = config.authCrypt
  delete config.password
  delete config.authCrypt
  if (!config._authCrypt || !crypto.Decipher) return
  var key = getKey()
  if (key === false) return undefined
  var c = (new crypto.Decipher).init("aes192", key)
  config._auth = c.update(config._authCrypt, "hex", "utf8")
  config._auth += c.final("utf8")
  delete config._authCrypt
  var unpw = base64.decode(config._auth).split(":")
  config.username = unpw[0] = (config.username || unpw[0])
  config._password = unpw[1] = (config._password || unpw[1])
  config._auth = base64.encode(unpw.join(":"))
  return config
}

function save (cb) {
  encryptAuth(config)
  var proto = config.__proto__
  config.__proto__ = {}
  var data = ini.stringify({"-":config}).trim()
  config.__proto__ = proto
  return (data) ? writeConfigfile(configfile, data, cb)
                : rmConfigfile(configfile, cb)
}
function writeConfigfile (configfile, data, cb) {
  return fs[cb?"writeFile":"writeFileSync"](configfile, data, "utf8", cb)
}
function rmConfigfile (configfile, cb) {
  if (!cb) return rmConfigfileSync(configfile)
  fs.stat(configfile, function (e) {
    if (e) return cb()
    fs.unlink(configfile, cb)
  })
}
function rmConfigfileSync (configfile) {
  try { fs.statSync(configfile) }
  catch (ex) { return true }
  return fs.unlinkSync(configfile)
}
  
function del (key, c) { delete (c || config)[key] }
function get (key, c) { return key ? (c || config)[key] : (c || config) }
function set (key, value, c) { return (c || config)[key] = value }
