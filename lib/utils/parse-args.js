// info about each config option.

var url = require("url")
  , path = require("path")
  , Stream
  , abbrev = require("./abbrev")
  , log = require("./log")

try { Stream = require("stream").Stream }
catch (e) { Stream = require("net").Stream }

module.exports = exports = parseArgs

// [array,of,things] = allowed vals
// [array,of,types] allowed types
// Type : allowed type
// NaN : since it never matches, means "not allowed"
exports.types =
  { argv : NaN
  , "auto-activate" : ["always", Boolean]
  , "auto-deactivate" : Boolean
  , binroot : path
  , browser : String
  , color : ["always", Boolean]
  , description : Boolean
  , dev : Boolean
  , dotnpm : String
  , editor : path
  , force : Boolean
  , globalconfig : path
  , group : String
  , gzipbin : String
  , listopts : String
  , listexclude: [null, String]
  , logfd : [Number, Stream]
  , loglevel : ["silent","win","error","warn","info","verbose","silly"]
  , manroot : path
  , "must-install" : Boolean
  , "node-version" : String
  , "onload-script" : [false, String]
  , outfd : [Number, Stream]
  , pre: Boolean
  , proxy : url
  , prune : Boolean
  , "rebuild-bundle" : Boolean
  , recursive : Boolean
  , registry : url
  , rollback : Boolean
  , root : path
  , tag : String
  , tar : String
  , tmproot : path
  , "unsafe-perm" : Boolean
  , "update-dependents" : Boolean
  , usage : Boolean
  , user : String
  , userconfig : path
  , version : Boolean
  , _exit : Boolean
  }

exports.shorthands =
  { s : ["--loglevel", "silent"]
  , d : ["--loglevel", "info"]
  , dd : ["--loglevel", "verbose"]
  , ddd : ["--loglevel", "silly"]
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
  , rf : ["--recursive", "--force"]
  , rb : ["--rebuild-bundle"]
  , "no-rb" : ["--no-rebuild-bundle"]
  , desc : ["--description"]
  , "no-desc" : ["--no-description"]
  , "nv" : ["--node-version"]
  , "local" : ["--no-global"]
  }


var typeDefs = exports.typeDefs =
  [ String
  , Boolean
  , url
  , Number
  , path
  , Stream
  ]

function parseArgs (args, types, shorthands) {
  var data = {}
    , key
    , remain = []
    , cooked = args
    , original = args.slice(0)
  if (!types) types = exports.types
  if (!shorthands) shorthands = exports.shorthands
  parse(args, data, remain, types, shorthands)
  // now data is full
  clean(data, types)
  data.argv = {remain:remain,cooked:cooked,original:original}
  return data
}

function clean (data, types) {
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
    if (!types.hasOwnProperty(k)) {
      data[k] = val
      return
    }
    if (!validate(data, k, val, types[k])) {
      log.error("invalid: "+k+"="+val)
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
  if (type !== type) {
    delete data[k]
    return false
  }
  if (val === type) {
    data[k] = val
    return true
  }
  if (type === path || type === String) {
    data[k] = String(val)
    if (type === path && data[k].charAt(0) !== "/") {
      data[k] = path.join(process.cwd(), data[k])
    }
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

function parse (args, data, remain, types, shorthands) {
  var key = null
    , abbrevs = abbrev(Object.keys(types))
    , shortAbbr = abbrev(Object.keys(shorthands))

  for (var i = 0; i < args.length; i ++) {
    var arg = args[i]
    if (arg.match(/^-{2,}$/)) {
      // done with keys.
      // the rest are args.
      remain.push.apply(remain, args.slice(i + 1))
      args[i] = "--"
      break
    }
    if (arg.charAt(0) === "-") {
      if (arg.indexOf("=") !== -1) {
        var v = arg.split("=")
        arg = v.shift()
        v = v.join("=")
        args.splice.apply(args, [i, 1].concat([arg, v]))
      }
      arg = arg.replace(/^-+/, '')
      if (shortAbbr[arg]) arg = shortAbbr[arg]
      // see if it's a shorthand
      // if so, splice and back up to re-parse it.
      if (shorthands[arg]) {
        args.splice.apply(args, [i, 1].concat(shorthands[arg]))
        i --
        continue
      }
      var no = false
      while (arg.toLowerCase().indexOf("no-") === 0) {
        no = !no
        arg = arg.substr(3)
      }
      var isBool = no || types[arg] === Boolean
      if (abbrevs[arg]) arg = abbrevs[arg]
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
      if (la && la.match(/^-{2,}$/)) {
        la = undefined
        i --
      }
      data[arg] = la === undefined ? true : la
      i ++
      continue
    }
    remain.push(arg)
  }
}


if (module === require.main) {
var assert = require("assert")
  , sys = require("sys")
; [["-v", {version:true}, []]
  ,["---v", {version:true}, []]
  ,["ls -s --no-reg connect -d",
    {loglevel:"info",registry:null},["ls","connect"]]
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
  ,["--tmproot=tmp -tar=gtar",
    {tmproot:path.join(process.cwd(), "tmp"),tar:"gtar"},[]]
  ,["--logfd x", {}, []]
  ,["a -true -- -no-false", {true:true},["a","-no-false"]]
  ,["a -no-false", {false:false},["a"]]
  ,["a -no-no-true", {true:true}, ["a"]]
  ,["a -no-no-no-false", {false:false}, ["a"]]
  ,["---NO-no-No-no-no-no-nO-no-no"+
    "-No-no-no-no-no-no-no-no-no"+
    "-no-no-no-no-NO-NO-no-no-no-no-no-no"+
    "-no-body-can-do-the-boogaloo-like-I-do"
   ,{"body-can-do-the-boogaloo-like-I-do":false}, []]
  ,["-no-strangers-to-love "+
    "--you-know the-rules --and so-do-i "+
    "---im-thinking-of=a-full-commitment "+
    "--no-you-would-get-this-from-any-other-guy "+
    "--no-gonna-give-you-up "+
    "-no-gonna-let-you-down=true "+
    "--no-no-gonna-run-around false "+
    "--desert-you=false "+
    "--make-you-cry false "+
    "--no-tell-a-lie "+
    "--no-no-and-hurt-you false"
   ,{"strangers-to-love":false
    ,"you-know":"the-rules"
    ,"and":"so-do-i"
    ,"you-would-get-this-from-any-other-guy":false
    ,"gonna-give-you-up":false
    ,"gonna-let-you-down":false
    ,"gonna-run-around":false
    ,"desert-you":false
    ,"make-you-cry":false
    ,"tell-a-lie":false
    ,"and-hurt-you":false
    },[]]
  ].forEach(function (test) {
    var argv = test[0].split(/\s+/)
      , opts = test[1]
      , rem = test[2]
      , actual = parseArgs(argv)
      , parsed = actual.argv
    delete actual.argv
    console.log(sys.inspect(actual, false, 2, true))
    for (var i in opts) {
      assert.equal(opts[i], actual[i])
    }
    assert.deepEqual(rem, parsed.remain)
  })
}
