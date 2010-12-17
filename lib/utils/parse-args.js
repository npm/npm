// info about each config option.

var url = require("url")
  , path = require("path")
  , Stream = require("stream").Stream

module.exports = exports = parseArgs

// [array,of,things] = allowed vals
// [array,of,types] allowed types
// Type : allowed type
var types = exports.types =
  { "auto-activate" : ["always", true, false]
  , "update-dependents" : Boolean
  , "auto-deactivate" : Boolean
  , tar : String
  , gzipbin : String
  , tag : String
  , proxy : url
  , root : path
  , globalconfig : path
  , userconfig : path
  , binroot : path
  , dev : Boolean
  , loglevel : ["silent","win","error","warn","info","verbose","silly"]
  , manroot : path
  , editor : path
  , tmproot : path
  , _exit : Boolean
  , logfd : [Number, Stream]
  , outfd : [Number, Stream]
  , color : Boolean
  , recursive : Boolean
  , force : Boolean
  , prune : Boolean
  , listopts : String
  , "must-install" : Boolean
  , browser : String
  , registry : url
  , usage : Boolean
  , argv : NaN
  , version : Boolean
  }

var shorthands = exports.shorthands =
  { s : ["--loglevel", "silent"]
  , d : ["--loglevel", "info"]
  , dd : ["--loglevel", "verbose"]
  , ddd : ["--loglevel", "silly"]
  , reg : ["--registry"]
  , noreg : ["--no-registry"]
  , reg : ["--registry"]
  , "no-reg" : ["--no-registry"]
  , silent : ["--loglevel", "silent"]
  , verbose : ["--loglevel", "verbose"]
  , h : ["--usage"]
  , "?" : ["--usage"]
  , help : ["--usage"]
  , v : ["--version"]
  , r : ["--recursive"]
  , f : ["--force"]
  }

var typeDefs = exports.typeDefs =
  [ String
  , Boolean
  , url
  , Number
  , path
  , Stream
  ]

function parseArgs (args, startVal) {
  var data = startVal || {}
    , key
    , remain = []
    , cooked = args
    , original = args.slice(0)
  parse(args, data, remain)
  // now data is full
  clean(data)
  data.argv = {remain:remain,cooked:cooked,original:original}
  return data
}

function clean (data) {
  Object.keys(data).forEach(function (k) {
    var val = data[k]
    if (typeof val === "string") {
      val = val.trim()
      if (val === "null" || val === "true" || val === "false") {
        val = JSON.parse(val)
      } else if (!isNaN(val)) {
        val = +val
      }
    }
    if (!types[k]) {
      data[k] = val
      return
    }
    if (!validate(data, k, val, types[k])) {
      console.error("invalid: "+k+"="+val)
    }
  })
}

function validate (data, k, val, type) {
  if (Array.isArray(type)) {
    for (var i = 0, l = type.length; i < l; i ++) {
      if (validate(data, k, val, type[i])) return true
    }
    delete data[k]
    return false
  }
  if (val === type) return true
  if (type === path || type === String) {
    data[k] = String(val)
    return true
  }
  if (type === Number) {
    var ok = !isNaN(val)
    if (!ok) delete data[k]
    else data[k] = +val
    return ok
  }
  if (type === Boolean) {
    if (val instanceof Boolean) val = val.valueOf()
    else val = !!val
    data[k] = val
    return true
  }
  if (val === false || val === null || val === undefined) {
    data[k] = null
    return true
  }
  if (url === type) {
    val = url.parse(val)
    if (!val || !val.hostname) delete data[k]
    else data[k] = val.href
    return val
  }
  if (type === Stream) {
    var ok = val instanceof Stream
    if (!ok) delete data[k]
    return ok
  }
  return false
}

function parse (args, data, remaining) {
  var key = null
  for (var i = 0; i < args.length; i ++) {
    var arg = args[i]
    if (arg === "--") {
      // done with keys.
      // the rest are args.
      remaining.push.apply(remaining, args.slice(i + 1))
      break
    }
    if (arg.charAt(0) === "-") {
      if (arg.indexOf("=") !== -1) {
        var v = arg.split("=")
        arg = v.shift()
        v = v.join("=")
        args.splice.apply(args, [i, 1].concat(["-"+arg, v]))
      }
      arg = arg.replace(/^-+/, '')
      // see if it's a shorthand
      // if so, splice and back up to re-parse it.
      if (shorthands[arg]) {
        args.splice.apply(args, [i, 1].concat(shorthands[arg]))
        i --
        continue
      }
      var no = (arg.indexOf("no-") === 0)
        , isBool = no || types[arg] === Boolean
      if (no) arg = arg.substr(3)
      if (isBool) {
        // just set and move along
        data[arg] = !no
        // however, also support --bool true or --bool false
        var la = args[i + 1]
        if (la === "true" || la === "false") {
          data[arg] = JSON.parse(la)
          if (no) data[arg] = !data[arg]
          i ++
        }
        continue
      }
      var la = args[i + 1]
      data[arg] = la === undefined ? true : la
      i ++
      continue
    }
    remaining.push(arg)
  }
}


if (module === require.main) {
var assert = require("assert")
  , sys = require("sys")
; [["-v", {version:true}, []]
  ,["---v", {version:true}, []]
  ,["ls -s --no-reg connect -d",{loglevel:"info",registry:null},["ls","connect"]]
  ,["ls ---s foo",{loglevel:"silent"},["ls","foo"]]
  ,["ls --registry blargle", {}, ["ls"]]
  ,["--no-registry", {registry:null}, []]
  ,["--no-color true", {color:false}, []]
  ,["--no-color false", {color:true}, []]
  ,["--no-color", {color:false}, []]
  ,["--color false", {color:false}, []]
  ,["--color --logfd 7", {logfd:7,color:true}, []]
  ,["--color=true", {color:true}, []]
  ,["--logfd=10", {logfd:10}, []]
  ,["--tmproot=/tmp -tar=gtar",{tmproot:"/tmp",tar:"gtar"},[]]
  ,["--logfd x", {}, []]
  ].forEach(function (test) {
    var argv = test[0].split(/\s+/)
      , opts = test[1]
      , rem = test[2]
      , actual = parseArgs(argv)
    console.log(sys.inspect(actual, false, 2, true))
    for (var i in opts) {
      assert.equal(opts[i], actual[i])
    }
    assert.deepEqual(rem, actual.argv.remain)
  })
}
