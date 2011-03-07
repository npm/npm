
module.exports = exports = search

var npm = require("../npm")
  , registry = require("./utils/registry")
  , semver = require("semver")
  , output = require("./utils/output")
  , log = require("./utils/log")

search.usage = "npm search [some search terms ...]"

search.completion = function (args, index, cb) {
  var compl = []
    , getCompletions = require("./utils/completion/get-completions")
    , name = (args.length + 1 === index) && args[args.length - 1] || ""
    , priors = name ? args.slice(0, args.length - 1) : args
  // get the batch of data that matches so far.
  // this is an example of using npm.commands.search programmatically
  // to fetch data that has been filtered by a set of arguments.
  search(priors, true, 3600, function (er, data) {
    if (er) return cb(er)
    Object.keys(data).forEach(function (name) {
      compl.push.apply(compl, [name].concat(data[name].words))
    })
    var last = null
    compl = compl.sort(strcmp).filter(function (c) {
      if (args.indexOf(c) !== -1) return false
      var r = c !== last
      last = c
      return r
    })
    var matches = getCompletions(name || "", compl)
    if (name && !name.match(/^=/)) {
      matches = matches.concat(getCompletions("="+name, compl))
    }
    cb(null, matches)
  })
}

function search (args, silent, staleness, cb_) {
  if (typeof cb_ !== "function") cb_ = staleness, staleness = 600
  if (typeof cb_ !== "function") cb_ = silent, silent = false
  var searchopts = npm.config.get("searchopts")
    , searchexclude = npm.config.get("searchexclude")
  if (typeof searchopts !== "string") searchopts = ""
  searchopts = searchopts.split(/\s+/)
  if (typeof searchexclude === "string") {
    searchexclude = searchexclude.split(/\s+/)
  } else searchexclude = []
  getFilteredData( staleness, searchopts.concat(args), searchexclude
                 , function (er, data) {
    // now data is the list of data that we want to show.
    // prettify and print it, and then provide the raw
    // data to the cb.
    if (er) return cb_(er)
    function cb (er) { return cb_(er, data) }
    if (silent) return cb()
    output.write(npm.config.get("outfd"), prettify(data, args), cb)
  })
}

function getFilteredData (staleness, args, notArgs, cb) {
  var processedData = {}
  getMergedData(staleness, function (er, data) {
    if (er) return cb(er)
    Object.keys(data).sort(strcmp).forEach(function (p) {
      var pkg = data[p]
      if (pkg.url && (!pkg.versions || !Object.keys(pkg.versions).length)) {
        processedData[pkg.name] = getWords(pkg)
      } else {
        Object.keys(pkg.versions).sort(semver.compare).forEach(function (v) {
          pkg.name = p
          processedData[pkg.name+"@"+v] = getWords(pkg, v)
        })
      }
    })
    var filtered = {}
    Object.keys(processedData).forEach(function (name) {
      var d = processedData[name]
        , pass = true
        , test = [name].concat(npm.config.get("description")
                               ? d.description : [])
                       .concat(d.keywords)
                       .concat(d.words)
      for (var i = 0, l = args.length; i < l; i ++) {
        pass = false
        for (var ii = 0, ll = test.length; ii < ll; ii ++) {
          if (test[ii].indexOf(args[i]) !== -1) {
            pass = true
            break
          }
        }
        if (!pass) break
      }
      if (pass) for (var i = 0, l = notArgs.length; i < l; i ++) {
        for (var ii = 0, ll = test.length; ii < ll; ii ++) {
          if (test[ii].indexOf(notArgs[i]) !== -1) {
            pass = false
            break
          }
        }
        if (!pass) break
      }
      if (pass) filtered[name] = d
    })
    return cb(null, filtered)
  })
}

function getWords (pkg, version) {
  var d = { data : pkg
          , words : []
          , name : pkg.name + (version ? "@" + version : "")
          }
  if (pkg.maintainers && pkg.maintainers.length) {
    d.words.push.apply(d.words, pkg.maintainers.map(function (m) {
      return "=" + m.name
    }))
  }
  var desc = pkg.description
    , kw = pkg.keywords
  if (pkg.url && !version) {
    d.words.push("<"+pkg.url+">")
  } else {
    var v = pkg.versions[version]
    if (v.description) desc = v.description
    if (v.keywords) kw = v.keywords
    if (v.tags.length) d.words.push.apply(d.words, v.tags)
    if (v.active) d.words.push("active")
  }
  if (!kw) kw = []
  if (!Array.isArray(kw)) kw = kw.split(/\s+/)
  d.keywords = kw
  d.description = npm.config.get("description") && desc || ""
  return d
}

function getMergedData (staleness, cb) {
  registry.get("/", null, staleness, function (er, remote) {
    if (er) return cb(er)
    return cb(null, merge(remote))
  })
}

function strcmp (a, b) {
  a = a.toLowerCase()
  b = b.toLowerCase()
  return a === b ? 0 : a > b ? 1 : -1
}

function prettify (data, args) {
  var pkgs = Object.keys(data)
    , attrs = []
    , names = []
    , pretty = []
    , beginAttrList = 28
  pkgs.forEach(function (name) {
    var pkg = data[name]
    pretty.push({name:name,attrs:data[name].words.sort(strcmp).join(" ")
                ,description:data[name].description
                ,keywords:data[name].keywords})
  })
  var colors = [36, 32, 33, 31, 35 ]
    , c = 0
    , l = colors.length
  var maxNameLen = 0
  var space = "                       "
  pretty.forEach(function (line) {
    maxNameLen = Math.min(Math.max(maxNameLen, line.name.length), space.length)
  })
  maxNameLen += 2

  // turn each line obj into a single line, only as much ws as necessary.
  try {
    var stdio = process.binding("stdio")
      , cols = stdio.isatty(stdio.stdoutFD) ?
        ( stdio.getColumns ? stdio.getColumns()
        : stdio.getWindowSize ? stdio.getWindowSize()[1]
        : Infinity )
        : Infinity
  }
  catch (ex) { cols = Infinity }
  pretty = pretty.map(function (line) {
    var addSpace = maxNameLen - line.name.length
    return (line.name + (space.substr(0, addSpace) || "") + " "
           + line.attrs + "   "
           + (line.description ? line.description + "    " : "")
           + (line.keywords.length ? " " + line.keywords.join(" ") : ""))
           .substr(0, cols)
  })

  if (args && pretty.length) args.forEach(function (arg) {
    pretty = pretty.map(function (line) {
      return line.split(arg).join("\033["+colors[c]+"m" + arg + "\033[m")
    })
    c = (c + 1) % l
  })
  if (!pretty.length) pretty = ["Nothing found"]
  pretty.push("")
  return pretty.join("\n")
}

function merge (remote) {
  var merged = {}
  // now merge in the remote stuff.
  for (var p in remote) {
    merged[p] = merged[p] || {versions:{}}
    for (var d in remote[p]) if (!merged[p].hasOwnProperty(d)) {
      merged[p][d] = remote[p][d]
    }
    for (var v in remote[p].versions) {
      merged[p].versions[v] = merged[p].versions[v] || {}
      merged[p].versions[v].tags = []
      var descs = remote[p].descriptions
      if (descs && descs[v] && descs[v] !== remote[p].description) {
        merged[p].versions[v].description = descs[v]
      }
      Object.keys(remote[p]["dist-tags"]).forEach(function (tag) {
        if (remote[p]["dist-tags"][tag] === v) {
          merged[p].versions[v].tags.push(tag)
        }
      })
    }
  }
  return merged
}

