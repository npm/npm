
module.exports = readJson
readJson.processJson = processJson

var fs = require("fs")
  , semver = require("./semver")
  , log = require("../utils/log")

function readJson (jsonFile, tag, cb) {
  log(jsonFile, "readJson")
  fs.readFile(jsonFile, processJson(tag, cb))
}
function processJson (tag, cb) {
  if (!cb) cb = tag, tag = null
  if (typeof cb !== "function") {
    var thing = cb, cb = null
    return P(null, thing)
  } else return P

  function P (er, thing) {
    if (er) {
      if (cb) return cb(er, thing)
      throw er
    }
    if (Object.prototype.toString.call(thing) === "[object Object]") {
      return processObject(tag, cb)(er, thing)
    } else {
      return processJsonString(tag, cb)(er, thing)
    }
  }
}
function processJsonString (tag, cb) { return function (er, jsonString) {
  jsonString += ""
  if (er) return cb(er, jsonString)
  var json
  try {
    json = JSON.parse(jsonString)
  } catch (ex) {
    var e = new Error(
      "Failed to parse json\n"+ex.message+"\n"+jsonString)
    if (cb) return cb(e)
    throw e
  }
  return processObject(tag, cb)(er, json)
}}
function processObject (tag, cb) { return function (er, json) {
  if (json.overlay) {
    ;["node", "npm"].forEach(function (k) {
      if (!json.overlay[k]) return undefined
      for (var i in json.overlay[k]) json[i] = json.overlay[k][i]
    })
  }

  // slashes would be a security risk.
  // anything else will just fail harmlessly.
  if (!json.name) {
    var e = new Error("No 'name' field found in package.json")
    if (cb) return cb(e)
    throw e
  }
  json.name = json.name.replace(/\//g, '-')
  if (tag) json.version += tag
  if (!(semver.valid(json.version))) {
    var e = new Error("Invalid version: "+json.version)
    if (cb) return cb(e)
    throw e
  }

  if (json.main) json.main = json.main.replace(/(\.js|\.node)$/, '')

  json._id = json.name+"-"+json.version
  json = testEngine(json)
  if (cb) cb(null,json)
  return json
}}

function testEngine (json) {
  if (!json.engines) json.engines = { "node" : "*" }

  var nodeVer = process.version
    , ok = false
  if (Array.isArray(json.engines)) {
    // Packages/1.0 commonjs style, with an array.
    // hack it to just hang a "node" member with the version range,
    // then do the npm-style check below.
    for (var i = 0, l = json.engines.length; i < l; i ++) {
      var e = json.engines[i].trim()
      if (e.substr(0, 4) === "node") {
        json.engines.node = e.substr(4)
        break
      }
    }
  }
  json._nodeSupported = semver.satisfies(nodeVer, json.engines.node || "undefined")
  return json
}
