
// TODO: Merge from other places, make locations configurable.
// Should look in {installPrefix}/etc/npmrc first by default,
// and then env.HOME/.npmrc for overrides.

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
  , npm = require("../../npm")
  , defaultConfig = require("./default-config")
  , configfile = path.join(process.env.HOME, '.npmrc')
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
  var auth = config.auth ? base64.decode(config.auth) : null
  if (config.username && config.password && !auth) {
    auth = config.username+":"+config.password
  }
  if (!auth || !crypto.Cipher) return
  var unpw = auth.split(":")
  config.username = unpw[0] = config.username || unpw[0]
  config.password = unpw[1] = config.password || unpw[1]
  auth = unpw.join(":")
  config.auth = base64.encode(auth)
  var key = getKey()
  if (key === false) return undefined
  var c = (new crypto.Cipher).init("aes192", key)
  config.authCrypt = c.update(config.auth, "utf8", "hex")
  config.authCrypt += c.final("hex")
  delete config.auth
  delete config.username
  delete config.password
}
function decryptAuth (config) {
  if (!config.authCrypt || !crypto.Decipher) return
  var key = getKey()
  if (key === false) return undefined
  var c = (new crypto.Decipher).init("aes192", key)
  config.auth = c.update(config.authCrypt, "hex", "utf8")
  config.auth += c.final("utf8")
  delete config.authCrypt
  var unpw = base64.decode(config.auth).split(":")
  config.username = unpw[0] = config.username || unpw[0]
  config.password = unpw[1] = config.password || unpw[1]
  config.auth = base64.encode(unpw.join(":"))
}

function save (cb) {
  encryptAuth(config)
  var proto = config.__proto__
  config.__proto__ = {}
  fs[
    cb ? "writeFile" : "writeFileSync"
  ](configfile, ini.stringify({"-":config}), "utf8", function (er) {
    config.__proto__ = proto
    cb(er)
  })
}
function del (key, c) { delete (c || config)[key] }
function get (key, c) { return key ? (c || config)[key] : (c || config) }
function set (key, value, c) { return (c || config)[key] = value }
