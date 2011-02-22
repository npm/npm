
module.exports = readJson
readJson.processJson = processJson
readJson.unParsePeople = unParsePeople
readJson.parsePeople = parsePeople

var fs = require("./graceful-fs")
  , semver = require("semver")
  , path = require("path")
  , log = require("./log")
  , npm = require("../../npm")
  , cache = {}
  , timers = {}
  , loadPackageDefaults = require("./load-package-defaults")

function readJson (jsonFile, opts, cb) {
  if (typeof cb !== "function") cb = opts, opts = {}
  if (cache.hasOwnProperty(jsonFile)) {
    log.verbose(jsonFile, "from cache")
    return cb(null, cache[jsonFile])
  }
  opts.file = jsonFile
  if (!opts.tag) {
    var parsedPath = jsonFile.indexOf(npm.dir) === 0 && jsonFile.match(
      /\/([^\/]+)\/([^\/]+)\/package\/package\.json$/)
    if (parsedPath && semver.valid(parsedPath[2])) {
      // this is a package.json in some installed package.
      // infer the opts.tag so that linked packages behave right.
      opts.tag = parsedPath[2]
    }
  }

  fs.readFile( path.join(path.dirname(jsonFile), "wscript")
             , function (er, data) {
    if (er) opts.wscript = false
    else opts.wscript = data.toString().match(/(^|\n)def build\b/)
                      && data.toString().match(/(^|\n)def configure\b/)
    fs.readFile(jsonFile, processJson(opts, function (er, data) {
      if (er) return cb(er)
      var doLoad = !(jsonFile.indexOf(npm.cache) === 0 &&
                     path.basename(path.dirname(jsonFile)) !== "package")
      if (!doLoad) return cb(er, data)
      loadPackageDefaults(data, path.dirname(jsonFile), cb)
    }))
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
  } catch (ex) {
    if (opts.file && opts.file.indexOf(npm.dir) === 0) {
      try {
        json = require("vm").runInNewContext("(\n"+jsonString+"\n)")
        log.error(opts.file, "Error parsing json")
        log.error(ex, "parse error ")
      } catch (ex2) {
        return jsonParseFail(ex, cb)
      }
    } else {
      return jsonParseFail(ex, cb)
    }
  }
  return processObject(opts, cb)(er, json)
}}

function jsonParseFail (ex, cb) {
  var e = new Error(
    "Failed to parse json\n"+ex.message)
  e.errno = npm.EJSONPARSE
  if (cb) return cb(e)
  throw e
}

function processObject (opts, cb) { return function (er, json) {

  // slashes would be a security risk.
  // anything else will just fail harmlessly.
  if (!json.name) {
    var e = new Error("No 'name' field found in package.json")
    if (cb) return cb(e)
    throw e
  }
  json.name = json.name.trim()
  if (json.name.charAt(0) === "." || json.name.match(/[\/@\s\+%:]/)) {
    var msg = "Invalid name: "
            + JSON.stringify(json.name)
            + " may not start with '.' or contain %/@+: or whitespace"
      , e = new Error(msg)
    if (cb) return cb(e)
    throw e
  }
  if (json.name.toLowerCase() === "node_modules") {
    var msg = "Invalid package name: node_modules"
      , e = new Error(msg)
    if (cb) return cb(e)
    throw e
  }
  if (json.name.toLowerCase() === "favicon.ico") {
    var msg = "Sorry, favicon.ico is a picture, not a package."
      , e = new Error(msg)
    if (cb) return cb(e)
    throw e
  }

  if (json.repostories) {
    var msg = "'repositories' (plural) No longer supported.\n"
            + "Please pick one, and put it in the 'repository' field."
      , e = new Error(msg)
    // uncomment once this is no longer an issue.
    // if (cb) return cb(e)
    // throw e
    log.error(msg, "incorrect json")
    json.repostory = json.repositories[0]
    delete json.repositories
  }

  if (json.repository) {
    if (typeof json.repository === "string") {
      json.repository = { type : "git"
                        , url : json.repository }
    }
    var repo = json.repository.url || ""
    repo = repo.replace(/^(https?|git):\/\/[^\@]+\@github.com/
                       ,'$1://github.com')
    if (json.repository.type === "git"
        && ( repo.match(/^https?:\/\/github.com/)
          || repo.match(/github.com\/[^\/]+\/[^\/]+\/?$/)
             && !repo.match(/\.git$/)
        )) {
      repo = repo.replace(/^https?:\/\/github.com/, 'git://github.com')
      if (!repo.match(/\.git$/)) {
        repo = repo.replace(/\/?$/, '.git')
      }
    }
    if (repo.match(/github\.com\/[^\/]+\/[^\/]+\/?$/)
        && repo.match(/\.git\.git$/)) {
      log.warn(repo, "Probably broken git url")
    }
    json.repository.url = repo
  }


  var tag = opts.tag
  if (tag) json.version = tag//+"-"+json.version

  if (json.modules) {
    if (typeof json.modules !== "object") {
      var e = new Error("Invalid modules object")
      if (cb) return cb(e)
      throw e
    }
    Object.keys(json.modules).forEach(function (mod) {
      if (typeof json.modules[mod] !== "string") {
        var e = new Error("Invalid module "+mod+", not a string: "
                         +JSON.stringify(json.modules[mod]))
        if (cb) return cb(e)
        throw e
      }
    })
  }

  if (opts.wscript) {
    var scripts = json.scripts = json.scripts || {}
    if (!scripts.install && !scripts.preinstall) {
      // don't fail if it was unexpected, just try.
      scripts.preinstall = "node-waf clean || true; node-waf configure build"
    }
  }

  if (!(semver.valid(json.version))) {
    var e = new Error("Invalid version: "+json.version+"\n"
                     +"Must be X.Y.Z, with an optional trailing tag.\n"
                     +"See the section on 'version' in `npm help json`")
    if (cb) return cb(e)
    throw e
  }
  json.version = semver.clean(json.version)

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
  json = parsePeople(unParsePeople(json))
  if ( json.bugs ) json.bugs = parsePerson(unParsePerson(json.bugs))
  json._npmVersion = npm.version
  json._nodeVersion = process.version
  if (opts.file) {
    log.verbose(opts.file, "caching")
    cache[opts.file] = json
    // arbitrary
    var keys = Object.keys(cache)
      , l = keys.length
    if (l > 10000) for (var i = 0; i < l - 5000; i ++) {
      delete cache[keys[i]]
    }
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
  log.silly(json, "testEngine")
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

  var nodeVer = npm.config.get("node-version")
    , ok = false
  if (nodeVer) nodeVer = nodeVer.replace(/\+$/, '')
  if (Array.isArray(json.engines)) {
    // Packages/1.0 commonjs style, with an array.
    // hack it to just hang a "node" member with the version range,
    // then do the npm-style check below.
    for (var i = 0, l = json.engines.length; i < l; i ++) {
      var e = json.engines[i].trim()
      if (e.substr(0, 4) === "node") {
        json.engines.node = e.substr(4)
      } else if (e.substr(0, 3) === "npm") {
        json.engines.npm = e.substr(3)
      }
    }
  }
  if (json.engines.node === "") json.engines.node = "*"
  if (json.engines.node && null === semver.validRange(json.engines.node)) {
    log.warn( json.engines.node
            , "Invalid range in engines.node.  Please see `npm help json`" )
  }

  if (nodeVer) {
    json._engineSupported = semver.satisfies( nodeVer
                                            , json.engines.node || "null" )
  }
  if (json.engines.hasOwnProperty("npm") && json._engineSupported) {
    json._engineSupported = semver.satisfies(npm.version, json.engines.npm)
  }
  return json
}

function unParsePeople (json) { return parsePeople(json, true) }
function parsePeople (json, un) {
  var fn = un ? unParsePerson : parsePerson
  if (json.author) json.author = fn(json.author)
  ;["maintainers", "contributors"].forEach(function (set) {
    if (Array.isArray(json[set])) json[set] = json[set].map(fn)
  })
  return json
}
function unParsePerson (person) {
  if (typeof person === "string") return person
  var name = person.name || ""
    , u = person.url || person.web
    , url = u ? (" ("+u+")") : ""
    , e = person.email || person.mail
    , email = e ? (" <"+e+">") : ""
  return name+email+url
}
function parsePerson (person) {
  if (typeof person !== "string") return person
  var name = person.match(/^([^\(<]+)/)
    , url = person.match(/\(([^\)]+)\)/)
    , email = person.match(/<([^>]+)>/)
    , obj = {}
  if (name && name[0].trim()) obj.name = name[0].trim()
  if (email) obj.email = email[1]
  if (url) obj.url = url[1]
  return obj
}
