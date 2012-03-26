
module.exports = exports = search

var npm = require("./npm.js")
  , registry = require("./utils/npm-registry-client/index.js")
  , semver = require("semver")
  , output
  , log = require("./utils/log.js")

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
    output = output || require("./utils/output.js")
    output.write(prettify(data, args), cb)
  })
}

function getFilteredData (staleness, args, notArgs, cb) {
  registry.get( "/-/all", null, staleness, false
              , true, function (er, data) {
    if (er) return cb(er)
    return cb(null, filter(data, args, notArgs))
  })
}

function filter (data, args, notArgs) {
  // data={<name>:{package data}}
  return Object.keys(data).map(function (d) {
    return data[d]
  }).filter(function (d) {
    return typeof d === "object"
  }).map(stripData).map(getWords).filter(function (data) {
    return filterWords(data, args, notArgs)
  }).reduce(function (l, r) {
    l[r.name] = r
    return l
  }, {})
}

function stripData (data) {
  return { name: data.name
         , description: npm.config.get("description") ? data.description : ""
         , maintainers: (data.maintainers || []).map(function (m) {
             return "=" + m.name
           })
         , url: !Object.keys(data.versions || {}).length ? data.url : null
         , keywords: data.keywords || []
         , time: data.time
                 && data.time.modified
                 && (new Date(data.time.modified).toISOString()
                     .split("T").join(" ")
                     .replace(/:[0-9]{2}\.[0-9]{3}Z$/, ""))
                     .slice(0, -5) // remove time
                 || "prehistoric"
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
    if (!match(words, args[i])) return false
  }
  for (var i = 0, l = notArgs.length; i < l; i ++) {
    if (match(words, notArgs[i])) return false
  }
  return true
}

function match (words, arg) {
  if (arg.charAt(0) === "/") {
    arg = arg.replace(/\/$/, "")
    arg = new RegExp(arg.substr(1, arg.length - 1))
    return words.match(arg)
  }
  return words.indexOf(arg) !== -1
}

function prettify (data, args) {
  try {
    var tty = require("tty")
      , stdout = process.stdout
      , cols = !tty.isatty(stdout.fd) ? Infinity
             : stdout._handle ? stdout._handle.getWindowSize()[0]
             : process.stdout.getWindowSize()[0]
      cols = (cols == 0) ? Infinity : cols
  } catch (ex) { cols = Infinity }

  // name, desc, author, keywords
  var longest = []
    , spaces
    , maxLen = npm.config.get("description")
             ? [1, 26, 60, 20, 11, Infinity]
             : [1, 26, 20, 11, Infinity]
    , headings = npm.config.get("description")
               ? [" ", "NAME", "DESCRIPTION", "AUTHOR", "DATE", "KEYWORDS"]
               : [" ", "NAME", "AUTHOR", "DATE", "KEYWORDS"]
    , lines
    , searchsort = (npm.config.get("searchsort") || "NAME").toLowerCase()
    , sortFields = { rating: 0
                   , name: 1
                   , description: 2
                   , author: 3
                   , date: 4
                   , keywords: 5 }
    , searchRev = searchsort.charAt(0) === "-"
    , sortField = sortFields[searchsort.replace(/^\-+/, "")]

  lines = Object.keys(data).map(function (d) {
    return data[d]
  }).map(function (data) {
    // turn a pkg data into a string
    // [name,who,desc,targets,keywords] tuple
    // also set longest to the longest name
    if (typeof data.keywords === "string") {
      data.keywords = data.keywords.split(/[,\s]+/)
    }
    if (!Array.isArray(data.keywords)) data.keywords = []
      var rating = getRating(data.time)

      var l = [
              String(rating)
            , data.name
            , data.description || ""
            , data.maintainers.join(" ")
            , data.time
            , (data.keywords || []).join(" ")
            ]
    l.forEach(function (s, i) {
      // limit description to maxLen.
      // Remember to change this when changing/reordering columns
      if (s.length > maxLen[i] && i == 2) {
        s = l[i] = s.substring(0, maxLen[i] - 1) + '>'
      }
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
  }).sort(function (a, b) {
    // a and b are "line" objects of [name, desc, maint, time, kw]
    var aa = a[sortField].toLowerCase()
      , bb = b[sortField].toLowerCase()
    return aa === bb ? 0
         : aa < bb ? (searchRev ? 1 : -1)
         : (searchRev ? -1 : 1)
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
    }).join(" ").substr(0, cols).trim()
  }).map(function (line) {
    // colorize!
    args.forEach(function (arg, i) {
      line = addColorMarker(line, arg, i)
    })
    return colorize(line).trim()
  })

  if (lines.length === 0) {
    return "No match found for "+(args.map(JSON.stringify).join(" "))
  }

  // build the heading padded to the longest in each field
  return headings.map(function (h, i) {
    var space = Math.max(2, 3 + (longest[i] || 0) - h.length)
    return h + (new Array(space).join(" "))
  }).join("").substr(0, cols) + "\n" + lines.join("\n")

}

var colors = [31, 33, 32, 36, 34, 35 ]
  , cl = colors.length
function addColorMarker (str, arg, i) {
  var m = i % cl + 1
    , markStart = String.fromCharCode(m)
    , markEnd = String.fromCharCode(0)

  if (arg.charAt(0) === "/") {
    //arg = arg.replace(/\/$/, "")
    return str.replace( new RegExp(arg.substr(1, arg.length - 1), "gi")
                      , function (bit) { return markStart + bit + markEnd } )

  }

  // just a normal string, do the split/map thing
  var pieces = str.toLowerCase().split(arg.toLowerCase())
    , p = 0

  return pieces.map(function (piece, i) {
    piece = str.substr(p, piece.length)
    var mark = markStart
             + str.substr(p+piece.length, arg.length)
             + markEnd
    p += piece.length + arg.length
    return piece + mark
  }).join("")
}

function colorize (line) {

  // replace rating number (first char) with sexy color block
  line = getRatingColor(line[0]) + line.slice(1)

  for (var i = 0; i < cl; i ++) {
    var m = i + 1
    line = line.split(String.fromCharCode(m)).join("\033["+colors[i]+"m")
  }
  return line.split("\u0000").join("\033[0m")
}

function getRating(dateString) {
  // simple rating based on modified time
  var aMonth = 1000 * 60 * 60 * 24 * 30 // a month (30 days) in milliseconds
  var aYearAgo = new Date().getTime() - aMonth * 12
  var oneMonthAgo = new Date().getTime() - aMonth * 1
  var threeMonthsAgo = new Date().getTime() - aMonth * 3
  var sixMonthsAgo = new Date().getTime() - aMonth * 6

  var modified = new Date(dateString).getTime() || aYearAgo
  if (modified > oneMonthAgo) {
    return 1
  } else if (modified > threeMonthsAgo) {
    return 2
  } else if (modified > sixMonthsAgo) {
    return 3
  } else if (modified > aYearAgo) {
    return 4
  } else {
    return 5
  }
}

function getRatingColor(rating) {
  var color
  switch(parseInt(rating)) {
    case 1:
      color = '\033[35;42m+' // green +
      break
    case 2:
      color = '\033[42m ' // green
      break
    case 3:
      color = '\033[43m ' // yellow
      break
    case 4:
      color = '\033[41m ' // red
      break
    case 5:
    default:
      color = '\033[9;41m ' // red
      break
  }
  return color + '\033[0m' // end
}
