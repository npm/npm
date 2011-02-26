
// show the installed versions of a package

module.exports = exports = ls

var npm = require("../npm")
  , readInstalled = require("./utils/read-installed")
  , registry = require("./utils/registry")
  , semver = require("semver")
  , output = require("./utils/output")
  , log = require("./utils/log")

ls.usage = "npm ls [some search terms ...]"

ls.completion = function (args, index, cb) {
  var compl = []
    , getCompletions = require("./utils/completion/get-completions")
    , name = (args.length + 1 === index) && args[args.length - 1] || ""
    , priors = name ? args.slice(0, args.length - 1) : args
  // get the batch of data that matches so far.
  // this is an example of using npm.commands.ls programmatically
  // to fetch data that has been filtered by a set of arguments.
  ls(priors, true, 3600, function (er, data) {
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

function ls (args, silent, staleness, cb_) {
  if (typeof cb_ !== "function") cb_ = staleness, staleness = 600
  if (typeof cb_ !== "function") cb_ = silent, silent = false
  var listopts = npm.config.get("listopts")
    , listexclude = npm.config.get("listexclude")
  if (typeof listopts !== "string") listopts = ""
  listopts = listopts.split(/\s+/)
  if (typeof listexclude === "string") listexclude = listexclude.split(/\s+/)
  else listexclude = []
  getFilteredData( staleness, listopts.concat(args), listexclude
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
    , includeRemote = args.indexOf("installed") === -1
  getMergedData(staleness, includeRemote, function (er, data) {
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
    if (v.installed) d.words.push("installed")
    if (v.remote) d.words.push("remote")
    if (v.tags.length) d.words.push.apply(d.words, v.tags)
    if (v.active) d.words.push("active")
  }
  if (!kw) kw = []
  if (!Array.isArray(kw)) kw = kw.split(/\s+/)
  d.keywords = kw
  d.description = npm.config.get("description") && desc || ""
  return d
}

function getMergedData (staleness, includeRemote, cb) {
  getData(staleness, includeRemote, function (er, remote, installed) {
    if (er) return cb(er)
    return cb(null, merge(installed, remote))
  })
}

function getData (staleness, includeRemote, cb_) {
  var installed
    , remote
    , errState

  readInstalled([], true, function (er, inst) {
    if (er) return cb_(errState = er)
    installed = inst
    next()
  })

  if (includeRemote) registry.get("/", null, staleness, function (er, rem) {
    if (errState) return
    if (er) rem = {}
    remote = rem
    next()
  })
  else remote = {}, next()

  function next () {
    if (!remote || !installed) return
    cb_(null, remote, installed)
  }
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

function merge (installed, remote) {
  var merged = {}
  // first, just copy the installed stuff
  for (var p in installed) {
    merged[p] = {versions:{}}
    for (var v in installed[p]) {
      merged[p].versions[v] = installed[p][v]
      merged[p].versions[v].installed = true
      merged[p].versions[v].tags = merged[p].versions[v].tags || []
    }
  }
  // now merge in the remote stuff.
  for (var p in remote) {
    merged[p] = merged[p] || {versions:{}}
    for (var d in remote[p]) if (!merged[p].hasOwnProperty(d)) {
      merged[p][d] = remote[p][d]
    }
    for (var v in remote[p].versions) {
      merged[p].versions[v] = merged[p].versions[v] || {}
      merged[p].versions[v].remote = true
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

