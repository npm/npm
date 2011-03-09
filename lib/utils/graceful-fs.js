
// wrapper around the non-sync fs functions to gracefully handle
// having too many file descriptors open.  Note that this is
// *only* possible because async patterns let one interject timeouts
// and other cleverness anywhere in the process without disrupting
// anything else.
var fs = require("fs")
  , timeout = 0
  , lstatCache = {}

Object.keys(fs)
  .forEach(function (i) {
    exports[i] = (typeof fs[i] !== "function") ? fs[i]
               : (i.match(/^[A-Z]|^create|Sync$/)) ? function () {
                   return fs[i].apply(fs, arguments)
                 }
               : graceful(fs[i], i)
  })

function graceful (fn, name) { return function GRACEFUL () {
  var args = Array.prototype.slice.call(arguments)
    , cb_ = args.pop()
    , filename = args[0]
  if (name === "lstat" && lstatCache.hasOwnProperty(filename)) {
    return process.nextTick(function () {
      cb_.apply(null, lstatCache[filename])
    })
  }
  args.push(cb)
  function cb (er) {
    if (er && er.message.match(/^(EMFILE|EAGAIN)/)) {
      setTimeout(function () {
        GRACEFUL.apply(fs, args)
      }, timeout ++)
      return
    }
    timer = 0
    if (name === "lstat") {
      lstatCache[filename] = arguments
    }
    cb_.apply(null, arguments)
  }
  fn.apply(fs, args)
}}
