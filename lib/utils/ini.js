
// TODO: Merge from other places, make locations configurable.
// Should look in {installPrefix}/etc/npmrc first by default,
// and then env.HOME/.npmrc for overrides.

var fs = require('fs')
  , path = require('path')
  , http = require('http')
  , log = require("./log")
  , ini = require("ini")
  , sys = require("sys")
  , hasSSL = false
  , crypto

try {
  crypto = require("crypto")
  hasSSL = true
} catch (ex) {
  crypto = {}
}

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
  sys.error( "* To rectify the situation, do this:" )
  sys.error( "* npm install crypto@0.0.5" )
  sys.error( "*" )
}

var sys = require("sys")
  , iamroot = (process.getuid() === 0)
  , npm = require("../../npm")
  , defaultConfig =
    { 'auto-activate' : true
    , root : iamroot ? path.join(process.installPrefix, "lib", "node")
           : require.paths[0].indexOf(".npm") !== -1 ? require.paths[1]
           : require.paths.length > 2 ? require.paths[0]
           : process.env.HOME ? path.join(process.env.HOME, '.node_libraries')
           : process.cwd()
    , binroot : path.join(process.installPrefix, "bin")
    , registry : hasSSL ? "https://registry.npmjs.org/"
               : "http://registry.npmjs.org/"
    }
  , configfile = path.join(process.env.HOME, '.npmrc')
  , config = getConfig() || {}
  , privateKey

exports.config = config
exports.save = save
exports.del = del
exports.get = get
exports.set = set

log(iamroot, "sudo")

function getConfig () {
  // TODO: --config <path> on the cli to set this.
  var config
  log(configfile, "configfile")
  try {
    config = "" + fs.readFileSync(configfile, "utf8")
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
  // root is special.
  config.root = config.root

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
  throw new Error("No private key found.")
}
function encryptAuth (config) {
  if (!config.auth || !crypto.Cipher) return
  try { var key = getKey() }
  catch (e) { return }
  var c = (new crypto.Cipher).init("aes192", key)
  config.authCrypt = c.update(config.auth, "utf8", "hex")
  config.authCrypt += c.final("hex")
  delete config.auth
}
function decryptAuth (config) {
  if (!config.authCrypt || !crypto.Decipher) return
  try { var key = getKey() }
  catch (e) { return }
  var c = (new crypto.Decipher).init("aes192", key)
  config.auth = c.update(config.authCrypt, "hex", "utf8")
  config.auth += c.final("utf8")
  delete config.authCrypt
}

function save (cb) {
  encryptAuth(config)
  config.__proto__ = {}
  fs[
    cb ? "writeFile" : "writeFileSync"
  ](configfile, ini.stringify({"-":config}), "utf8", function (er) {
    config.__proto__ = defaultConfig
    cb(er)
  })
}
function del (key, c) { delete (c || config)[key] }
function get (key, c) { return key ? (c || config)[key] : (c || config) }
function set (key, value, c) { return (c || config)[key] = value }
