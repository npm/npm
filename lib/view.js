// npm view [pkg [pkg ...]]

module.exports = view
view.usage = "npm view pkg[@version] [<field>[.subfield]...]"

view.completion = function (args, index, cb) {
  var registry = require("./utils/registry")
    , getCompletions = require("./utils/completion/get-completions")
    , remotePkgs = require("./utils/completion/remote-packages")
    , name = args[0] || ""
    , key = args[1] || ""

  if (index < 3) remotePkgs(args, index, true, false, false, cb)
  else if (index == 3) {
    var pieces = name.split("@")
    registry.get(pieces[0], pieces[1], function (er, d) {
      var cur = d.versions ? d.versions[d["dist-tags"].latest] : d
        , path = key.split(".")
        , options
      if (path.length > 1) {
        for (var i = 0; i < path.length; i++) {
          if (!cur) return cb()
          if (!cur[path[i]]) break
          else cur = cur[path[i]]
        }
        options = Object.keys(cur).map(function (e) {
          return path.slice(0, path.length - 1).join(".") + "." + e
        })
      } else options = Object.keys(cur).concat(["ctime","mtime","maintainers"])
      cb(null, getCompletions(key, options))
    })
  }
}

var registry = require("./utils/registry")
  , ini = require("./utils/ini-parser")
  , log = require("./utils/log")
  , sys = require("./utils/sys")
  , output = require("./utils/output")
  , npm = require("../npm")
  , semver = require("./utils/semver")
  , readJson = require("./utils/read-json")

function view (args, cb) {
  if (!args.length) return cb("Usage: "+view.usage)
  var pkg = args.shift()
    , nv = pkg.split("@")
    , name = nv.shift()
    , version = nv.join("@") || npm.config.get("tag")
  // get the data about this package
  registry.get(name, function (er, data) {
    if (er) return cb(er)
    if (data["dist-tags"].hasOwnProperty(version)) {
      version = data["dist-tags"][version]
    }
    var results = []
      , error = null
    if (!args.length) args = [""]
    Object.keys(data.versions).forEach(function (v) {
      data.versions[v] = readJson.processJson(data.versions[v])
      if (semver.satisfies(v, version)) args.forEach(function (args) {
        results.push(showFields(data, data.versions[v], args))
      })
    })
    results = results.reduce(reducer, {})
    if (error) cb(error, results)
    else printData(results, cb)
  })
}
function reducer (l, r) {
  if (r) Object.keys(r).forEach(function (v) {
    l[v] = l[v] || {}
    Object.keys(r[v]).forEach(function (t) {
      l[v][t] = r[v][t]
    })
  })
  return l
}
// return whatever was printed
function showFields (data, version, fields) {
  var o = {}
  ;[data,version].forEach(function (s) {
    Object.keys(s).forEach(function (k) {
      o[k] = s[k]
    })
  })
  return search(o, fields.split("."), version._id, fields)
}
function search (data, fields, version, title) {
  var field
    , tail = fields
  while (!field && fields.length) field = tail.shift()
  fields = [field].concat(tail)
  if (!field && !tail.length) {
    var o = {}
    o[version] = {}
    o[version][title] = data
    return o
  }
  var index = field.match(/(.+)\[([0-9]+)\]$/)
  if (index) {
    field = index[1]
    index = index[2]
    if (Array.isArray(data[field]) && index < data[field].length) {
      return search(data[field][index], tail, version, title)
    } else {
      field = field + "[" + index + "]"
    }
  }
  if (Array.isArray(data)) {
    if (data.length === 1) {
      return search(data[0], fields, version, title)
    }
    var results = []
      , res = null
    data.forEach(function (data, i) {
      var tl = title.length
        , newt = title.substr(0, tl-(fields.join(".").length) - 1)
               + "["+i+"]" + [""].concat(fields).join(".")
      results.push(search(data, fields.slice(), version, newt))
    })
    results = results.reduce(reducer, {})
    return results
  }
  if (!data.hasOwnProperty(field)) {
    return
  }
  data = data[field]
  if (tail.length) {
    if (typeof data === "object") {
      // there are more fields to deal with.
      return search(data, tail, version, title)
    } else {
      return new Error("Not an object: "+data)
    }
  }
  var o = {}
  o[version] = {}
  o[version][title] = data
  return o
}

function printData (data, cb) {
  var outfd = npm.config.get("outfd")
    , versions = Object.keys(data)
    , msg = ""
    , showVersions = versions.length > 1
    , showFields
  function cb_ (er) { return cb(er, data) }

  versions.forEach(function (v, i) {
    var fields = Object.keys(data[v])
    showFields = showFields || (fields.length > 1)
    fields.forEach(function (f) {
      var d = cleanup(data[v][f])
      if (showVersions || showFields || typeof d !== "string") {
        d = sys.inspect(cleanup(data[v][f]), false, 5, true)
      }
      if (f && showFields) f += " = "
      if (d.indexOf("\n") !== -1) f += "\n"
      msg += (showVersions ? v + " " : "") + (showFields ? f : "") + d + "\n"
    })
  })
  output.write(outfd, msg, cb_)
}
function cleanup (data) {
  if (Array.isArray(data)) {
    if (data.length === 1) {
      data = data[0]
    } else {
      return data.map(cleanup)
    }
  }
  if (!data || typeof data !== "object") return data
  delete data.versions

  var keys = Object.keys(data)
  keys.forEach(function (d) {
    if (d.charAt(0) === "_") delete data[d]
    else if (typeof data[d] === "object") data[d] = cleanup(data[d])
  })
  keys = Object.keys(data)
  if (keys.length <= 3
      && data.name
      && (keys.length === 1
          || keys.length === 3 && data.email && data.url
          || keys.length === 2 && (data.email || data.url))) {
    data = unparsePerson(data)
  }
  return data
}
function unparsePerson (d) {
  if (typeof d === "string") return d
  return d.name
       + (d.email ? " <"+d.email+">" : "")
       + (d.url ? " ("+d.url+")" : "")
}

