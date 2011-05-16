
module.exports = exports = search

var npm = require("../npm")
  , registry = require("./utils/npm-registry-client")
  , semver = require("semver")
  , output
  , log = require("./utils/log")
  , underscore = require("underscore")
  
search.usage = "npm search [some search terms ...]"

search.completion = function (opts, cb) {
  var compl = {}
    , partial = opts.partialWord
    , ipartial = partial.toLowerCase()
    , plen = partial.length

  // get the batch of data that matches so far.
  // this is an example of using npm.commands.search programmatically
  // to fetch data that has been filtered by a set of arguments.
  search(opts.conf.argv.remain.slice(2), true, function (er, data) {
    if (er) return cb(er)
    Object.keys(data).forEach(function (name) {
      data[name].words.split(" ").forEach(function (w) {
        if (w.toLowerCase().indexOf(ipartial) === 0) {
          compl[partial + w.substr(plen)] = true
        }
      })
    })
    cb(null, Object.keys(compl))
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
  var opts = searchopts.concat(args).map(function (s) {
    return s.toLowerCase()
  }).filter(function (s) { return s })
  searchexclude = searchexclude.map(function (s) {
    return s.toLowerCase()
  })
  getFilteredData( staleness, opts, searchexclude, function (er, data) {
    // now data is the list of data that we want to show.
    // prettify and print it, and then provide the raw
    // data to the cb.
    if (er || silent) return cb_(er, data)
    function cb (er) { return cb_(er, data) }
    output = output || require("./utils/output")
    output.write(prettify(data, args), cb)
  })
}

function getFilteredData (staleness, args, notArgs, cb) {
  var leftToRun = args.length;
  var aggregateData = {};
  
  args.forEach(function(it) {
      registry.get("/-/search/\"" + it + "\"/\"" + it + "\"/25", null, staleness, function (er, data) {
        if (er) return cb(er)
        Object.keys(data).forEach(function(key) {
            aggregateData[key] = data[key];
        });
        if(--leftToRun == 0)
            return cb(null, filter(aggregateData, args, notArgs))
      })      
  });
}

function filter (data, args, notArgs) {
  // data={<name>:{package data}}
  return Object.keys(data).map(function (d) {
    return data[d]
  }).map(stripData).map(getWords).filter(function (data) {
    return filterWords(data, args, notArgs)
  }).reduce(function (l, r) {
    l[r.name] = r
    return l
  }, {})
}

function stripData (data) {
  return { name:data.name
         , description:npm.config.get("description") ? data.description : ""
         , maintainers:(data.maintainers || []).map(function (m) {
             return "=" + m.name
           })
         , url:!Object.keys(data.versions || {}).length ? data.url : null
         , keywords:data.keywords || []
         }
}

function getWords (data) {
  data.words = [ data.name ]
               .concat(data.description)
               .concat(data.maintainers)
               .concat(data.url && ("<" + data.url + ">"))
               .concat(data.keywords)
               .map(function (f) { return f && f.trim && f.trim() })
               .filter(function (f) { return f })
               .join(" ")
               .toLowerCase()
  return data
}

function filterWords (data, args, notArgs) {
  var words = data.words
  for (var i = 0, l = args.length; i < l; i ++) {
    if (words.indexOf(args[i]) === -1) {
      return false
    }
  }
  for (var i = 0, l = notArgs.length; i < l; i ++) {
    if (words.indexOf(notArgs[i]) !== -1) return false
  }
  return true
}

function prettify (data, args) {
  try {
    var stdio = process.binding("stdio")
      , cols = stdio.isatty(stdio.stdoutFD) ?
        ( stdio.getColumns ? stdio.getColumns()
        : stdio.getWindowSize ? stdio.getWindowSize()[1]
        : Infinity )
        : Infinity
  } catch (ex) { cols = Infinity }

  // name, desc, author, keywords
  var longest = []
    , spaces
    , maxLen = [20, 60, 20]
  return Object.keys(data).map(function (d) {
    return data[d]
  }).map(function (data) {
    // turn a pkg data into a string
    // [name,who,desc,targets,keywords] tuple
    // also set longest to the longest name
    if (typeof data.keywords === "string") {
      data.keywords = data.keywords.split(/[,\s]+/)
    }
    if (!Array.isArray(data.keywords)) data.keywords = []
    var l = [ data.name
            , data.description || ""
            , data.maintainers.join(" ")
            , (data.keywords || []).join(" ")
            ]
    l.forEach(function (s, i) {
      var len = s.length
      longest[i] = Math.min(maxLen[i] || Infinity
                           ,Math.max(longest[i] || 0, len))
      if (len > longest[i]) {
        l._undent = l._undent || []
        l._undent[i] = len - longest[i]
      }
      l[i] = l[i].replace(/\s+/g, " ")
    })
    return l
  }).map(function (line) {
    return line.map(function (s, i) {
      spaces = spaces || longest.map(function (n) {
        return new Array(n + 2).join(" ")
      })
      var len = s.length
      if (line._undent && line._undent[i - 1]) {
        len += line._undent[i - 1] - 1
      }
      return s + spaces[i].substr(len)
    }).join(" ").substr(0, cols)
  }).sort(function (a, b) {
    return a === b ? 0 : a > b ? 1 : -1
  }).map(function (line) {
    // colorize!
    args.forEach(function (arg, i) {
      line = addColorMarker(line, arg, i)
    })
    return colorize(line)
  }).join("\n")
}

var colors = [31, 33, 32, 36, 34, 35 ]
  , cl = colors.length
function addColorMarker (str, arg, i) {
  var m = i % cl + 1
    , markStart = String.fromCharCode(m)
    , markEnd = String.fromCharCode(0)
    , pieces = str.toLowerCase().split(arg.toLowerCase())
    , p = 0
  return pieces.map(function (piece, i) {
    piece = str.substr(p, piece.length)
    var mark = markStart
             + str.substr(p+piece.length, arg.length)
             + markEnd
    p += piece.length + arg.length
    return piece + mark
  }).join("")
  return str.split(arg).join(mark)
}
function colorize (line) {
  for (var i = 0; i < cl; i ++) {
    var m = i + 1
    line = line.split(String.fromCharCode(m)).join("\033["+colors[i]+"m")
  }
  return line.split("\u0000").join("\033[0m")
}
