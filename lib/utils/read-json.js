
module.exports = readJson
readJson.processJson = processJson

var fs = require("./graceful-fs")
  , semver = require("./semver")
  , path = require("path")
  , log = require("./log")
  , npm = require("../../npm")
  , cache = {}
  , timers = {}
function readJson (jsonFile, opts, cb) {
  if (typeof cb !== "function") cb = opts, opts = {}
  if (cache.hasOwnProperty(jsonFile)) {
    log.verbose(jsonFile, "from cache")
    return cb(null, cache[jsonFile])
  }
  fs.readFile(path.join(path.dirname(jsonFile), "wscript"), function (er, data) {
    opts.file = jsonFile
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
    if (typeof thing === "object" && !Buffer.isBuffer(thing)) {
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
  json.name = json.name.trim()
  if (json.name.charAt(0) === "." || json.name.match(/[\/@\s]/)) {
    var msg = "Invalid name: "
            + JSON.stringify(json.name)
            + " may not start with '.' or contain '/' or '@' or whitespace"
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

  // FIXME: uncomment in 0.3.0, once it's not likely that people will
  // have a bunch of main.js files kicking around any more, and remove
  // this functionality from lib/build.js
  //
  // if (json.main) {
  //   if (!json.modules) json.modules = {}
  //   json.modules.index = json.main
  //   delete json.main
  // }

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

  if (json.bin && typeof json.bin === "string") {
    var b = {}
    b[ path.basename( json.bin ) ] = json.bin
    json.bin = b
  }

  if (json["dev-dependencies"] && !json.devDependencies) {
    json.devDependencies = json["dev-dependencies"]
    delete json["dev-dependencies"]
  }
  ;["dependencies", "devDependencies"].forEach(function (d) {
    if (!json[d]) return
    json[d] = depObjectify(json[d])
  })

  json._id = json.name+"@"+json.version
  json = testEngine(json)
  json = parsePeople(json)
  json._npmVersion = npm.version
  json._nodeVersion = process.version
  if (opts.file) {
    log.verbose(opts.file, "caching")
    cache[opts.file] = json
    // just in case this is a long-running process...
    clearTimeout(timers[opts.file])
    timers[opts.file] = setTimeout(function () {
      delete cache[opts.file]
      delete timers[opts.file]
    }, 1000 * 60 * 60 * 24)
  }
  if (cb) cb(null,json)
  return json
}}
function depObjectify (deps) {
  if (!Array.isArray(deps)) return deps
  var o = {}
  deps.forEach(function (d) {
    d = d.trim().split(/(:?[@\s><=])/)
    o[d.shift()] = d.join("").trim().replace(/^@/, "")
  })
  return o
}
function testEngine (json) {
  // if engines is empty, then assume that node is allowed.
  log.verbose(json, "testEngine")
  if ( !json.engines
      || Array.isArray(json.engines)
        && !json.engines.length
      || typeof json.engines === "object"
        && !Object.keys(json.engines).length
      ) {
    json.engines = { "node" : "*" }
  }
  if (typeof json.engines === "string") {
    if (semver.validRange(json.engines) !== null) {
      json.engines = { "node" : json.engines }
    } else json.engines = [ json.engines ]
  }

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
  if (json.engines.node === "") json.engines.node = "*"
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
