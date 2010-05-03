
// TODO: Use ini parsing instead of JSON.  More humane.

// TODO: Merge from other places, make locations configurable.
// Should look in {installPrefix}/etc/npmrc first by default,
// and then env.HOME/.npmrc for overrides.

var fs = require('fs')
  , path = require('path')
  , http = require('http')
  , log = require("./log")
  , ini = require("ini")
  , crypto = require("crypto")
  , sys = require("sys")

// if installed, use rhys' package explicitly
if (typeof crypto.Cipher !== "function") {
  try {
    crypto = require("crypto-0.0.5")
  } catch (ex) {}
}
if (typeof crypto.Cipher !== "function") {
  sys.error( "*" )
  sys.error( "* Warning: Cipher unavailable in this nodejs version ("
           + process.version + ")")
  sys.error( "* Username/password stored in the clear" )
  sys.error( "*" )
  return
}

var sys = require("sys")
  , defaultConfig  =
    { 'auto-activate' : true
    , root : path.join(process.env.HOME, '.node_libraries')
    , registry : "https://registry.npmjs.org/"
    }
  , configfile = path.join(process.env.HOME, '.npmrc')
  , config = getConfig()
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
    config = fs.readFileSync(configfile, "utf8")
    // TODO v0.0.8: remove this JSON parse next version
    try {
      config = JSON.parse(config)
    } catch (ex) {
      config = ini.parse(config)["-"]
    }
  } catch (ex) {
    config = defaultConfig
  }
  for (var c in defaultConfig) {
    if (!config.hasOwnProperty(c)) {
      config[c] = defaultConfig[c]
    }
  }
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
      return (privateKey = fs.readFileSync(keys[i]))
    } catch (e) {}
  }
  throw new Error("No private key found.")
}
function encryptAuth (config) {
  if (!config.auth || !crypto.Cipher) return
  var c = (new crypto.Cipher).init("aes192", getKey())
  config.authCrypt = c.update(config.auth, "utf8", "hex")
  config.authCrypt += c.final("hex")
  delete config.auth
}
function decryptAuth (config) {
  if (!config.authCrypt || !crypto.Decipher) return
  var c = (new crypto.Decipher).init("aes192", getKey())
  config.auth = c.update(config.authCrypt, "hex", "utf8")
  config.auth += c.final("utf8")
  delete config.authCrypt
}

function save (cb) {
  encryptAuth(config)
  fs[
    cb ? "writeFile" : "writeFileSync"
  ](configfile, ini.stringify({"-":config}), "utf8", cb)
}
function del (key, c) { delete (c || config)[key] }
function get (key, c) { return (c || config)[key] }
function set (key, value, c) { return (c || config)[key] = value }
