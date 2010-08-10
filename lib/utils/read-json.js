
module.exports = readJson
readJson.processJson = processJson

var fs = require("fs")
  , semver = require("./semver")
  , path = require("path")

function readJson (jsonFile, opts, cb) {
  if (typeof cb !== "function") cb = opts, opts = {}
  fs.readFile(path.join(path.dirname(jsonFile), "wscript"), function (er, data) {
    if (er) opts.wscript = false
    else opts.wscript = data.toString().match(/(^|\n)def build\b/)
                      && data.toString().match(/(^|\n)def configure\b/)
    fs.readFile(jsonFile, processJson(opts, cb))
  })
}
function processJson (opts, cb) {
  if (typeof cb !== "function") cb = opts, opts = {}
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
      return processObject(opts, cb)(er, thing)
    } else {
      return processJsonString(opts, cb)(er, thing)
    }
  }
}
function processJsonString (opts, cb) { return function (er, jsonString) {
  jsonString += ""
  if (er) return cb(er, jsonString)
  var json
  try {
    json = JSON.parse(jsonString)
  } catch (ex2) { try {
    json = process.binding("evals").Script.runInNewContext("(\n"+jsonString+"\n)")
  } catch (ex) {
    var e = new Error(
      "Failed to parse json\n"+ex.message+"\n"+ex2.message+"\n"+jsonString)
    if (cb) return cb(e)
    throw e
  }}
  return processObject(opts, cb)(er, json)
}}
function processObject (opts, cb) { return function (er, json) {
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
  if (json.name.charAt(0) === "." || json.name.match(/\//)) {
    var msg = "Invalid name: "
            + JSON.stringify(json.name)
            + " may not start with '.' or contain '/'"
      , e = new Error(msg)
    if (cb) return cb(e)
    throw e
  }
  var tag = opts.tag
  if (tag && tag.indexOf(json.version) === 0) {
    tag = tag.substr(json.version.length)
  }
  if (tag && tag.indexOf("-1-LINK") !== -1) {
    tag = tag.substr(tag.indexOf("-1-LINK"))
  }
  if (tag && semver.valid(json.version + tag)) {
    json.version += tag
  }

  if (opts.wscript) {
    var scripts = json.scripts = json.scripts || {}
    if (!scripts.install && !scripts.preinstall) {
      // don't fail if it was unexpected, just try.
      scripts.preinstall = "node-waf configure build"
    }
  }

  if (!(semver.valid(json.version))) {
    var e = new Error("Invalid version: "+json.version)
    if (cb) return cb(e)
    throw e
  }

  if (json.main) json.main = json.main.replace(/(\.js|\.node)$/, '')

  if (json["dev-dependencies"] && !json.devDependencies) {
    json.devDependencies = json["dev-dependencies"]
    delete json["dev-dependencies"]
  }
  ;["dependencies", "devDependencies"].forEach(function (d) {
    if (!json[d]) return
    json[d] = depObjectify(json[d])
  })

  json._id = json.name+"-"+json.version
  json = testEngine(json)
  json = parsePeople(json)
  if (cb) cb(null,json)
  return json
}}
function depObjectify (deps) {
  if (!Array.isArray(deps)) return deps
  var o = {}
  deps.forEach(function (d) { o[d] = "*" })
  return o
}
function testEngine (json) {
  if (!json.engines) json.engines = { "node" : "*" }

  var nodeVer = process.version.replace(/\+$/, '')
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

function parsePeople (json) {
  if (json.author) json.author = parsePerson(json.author)
  ;["maintainers", "contributors"].forEach(function (set) {
    if (Array.isArray(json[set])) json[set] = json[set].map(parsePerson)
  })
  return json
}
function parsePerson (person) {
  if (typeof person !== "string") return person
  var name = person.match(/^([^\(<]+)/)
    , url = person.match(/\(([^\)]+)\)/)
    , email = person.match(/<([^>]+)>/)
    , obj = { "name" : (name && name[0] || person).trim() }
  if (email) obj.email = email[1]
  if (url) obj.url = url[1]
  return obj
}
