
// TODO: Merge from other places, make locations configurable.
// Should look in {installPrefix}/etc/npmrc first by default,
// and then env.HOME/.npmrc for overrides.


/*

Create a chain of config objects, in this priority order:

CLI - the --foo things in the command line.
ENV - all the things starting with npm_ in the environment
USER - $HOME/.npmrc
GLOBAL - $PREFIX/etc/npmrc

If the CLI or ENV specify a configfile, then that is used
as the USER config.

If the CLI or ENV specify a configfile, and also have
--config global, then that is used as the GLOBAL config.

export npm_configfile=/some/other/file
export npm_global_configfile=global

For implementation reasons, "_" in env vars is turned into "-"

*/


var fs = require('fs')
  , path = require('path')
  , http = require('http')
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

var sys = require("sys")
  , defaultConfig = require("./default-config")
  , configfile = path.existsSync(defaultConfig.configFile)
               ? defaultConfig.configFile
               : path.join(process.env.HOME, '.npmrc')
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
    // TODO v0.0.8: remove this JSON parse next version
    try {
      config = JSON.parse(config)
    } catch (ex) {
      config = ini.parse(config)["-"]
    }
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
