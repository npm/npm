
/*
log levels:
0,1,2,3
verbose,info,warn,error

Default setting for logs is "info"
Default setting to show is "info"

Possible values of level/loglevel:
silly,verbose,info,warn,error,win,silent

silent quiets everything


*/


module.exports = log
var stdio = process.binding("stdio")
  , doColor
function colorize (msg, color) {
  if (!msg) return ""
  if (doColor === undefined) {
    try {
      doColor = stdio.isatty(logStream.fd)
    } catch (ex) {
      doColor = true
    }
  }
  if (!doColor) return msg
  return "\033["+color+"m"+msg+"\033[0m"
}

var l = -1
  , LEVEL = { silly   : l++
            , verbose : l++
            , info    : l++
            , WARN    : l++
            , "ERR!"  : l++
            , ERROR   : "ERR!"
            , ERR     : "ERR!"
            , win     : 0x15AAC5
            , paused  : 0x19790701
            , silent  : 0xDECAFBAD
            }
  , COLOR = {}
  , SHOWLEVEL
log.LEVEL = LEVEL
Object.keys(LEVEL).forEach(function (l) {
  if (typeof LEVEL[l] === "string") LEVEL[l] = LEVEL[LEVEL[l]]
  else LEVEL[LEVEL[l]] = l
  LEVEL[l.toLowerCase()] = LEVEL[l]
  if (l === "silent" || l === "paused") return
  log[l] = log[l.toLowerCase()] =
    function (msg, pref, cb) { return log(msg, pref, l, cb) }
})
COLOR[LEVEL.silly] = 30
COLOR[LEVEL.verbose] = 34
COLOR[LEVEL.info] = 32
COLOR[LEVEL.warn] = 33
COLOR[LEVEL.error] = 31
for (var c in COLOR) COLOR[LEVEL[c]] = COLOR[c]
COLOR.npm = "37;40"
COLOR.pref = 35

var logBuffer = []
  , ini = require("./ini")
  , waitForConfig
log.waitForConfig = function () { waitForConfig = true }

// now the required stuff has been loaded,
// so the transitive module dep will work
var sys = require("./sys")
  , npm = require("../../npm")
  , net = require("net")

Object.defineProperty(log, "level",
  { get : function () {
      if (typeof SHOWLEVEL !== "undefined") return SHOWLEVEL
      var show = npm.config && npm.config.get("loglevel") || ''
      show = show.split(",")[0]
      if (!isNaN(show)) show = +show
      else if (!LEVEL.hasOwnProperty(show)) {
        sys.error("Invalid loglevel config: "+JSON.stringify(show))
        show = "info"
      }
      if (isNaN(show)) show = LEVEL[show]
      else show = +show
      if (!waitForConfig || ini.resolved) SHOWLEVEL = show
      return show
    }
  , set : function (l) {
      SHOWLEVEL = undefined
      npm.config.set("showlevel", l)
    }
  })
var logStream
function log (msg, pref, level, cb) {
  if (typeof level === "function") cb = level, level = null
  var show = log.level
  if (show === LEVEL.silent || show === LEVEL.paused) return cb && cb()
  if (level == null) level = LEVEL.info
  if (isNaN(level)) level = LEVEL[level]
  else level = +level
  // logging just undefined is almost never the right thing.
  // a lot of these are kicking around throughout the codebase
  // with relatively unhelpful prefixes.
  if (msg === undefined) {
    msg = [msg, (new Error).stack.split(/\n/).slice(2)]
  }
  if (typeof msg !== "string" && !(msg instanceof Error)) {
    msg = sys.inspect(msg, 0, 4, true)
  }
  if (msg instanceof Error) {
    msg = msg.stack || msg.toString()
    level = LEVEL.error
  }
  if (!ini.resolved && waitForConfig || level === LEVEL.paused) {
    return logBuffer.push([msg, pref, level])
  }
  if (logBuffer.length && !logBuffer.discharging) {
    logBuffer.push([msg, pref, level])
    logBuffer.discharging = true
    logBuffer.forEach(function (l) { log.apply(null, l) })
    logBuffer.length = 0
    delete logBuffer.discharging
    return
  }
  log.level = show

  var logFD = npm.config.get("logfd")
    , ls
  // effectively sending errors to /dev/null
  if (!logFD && logFD !== 0) cb && cb() || true
  if (typeof logFD === "string") logFD = +logFD
  if (logFD && typeof logFD === "object") {
    ls = logFD
    logFD = ls.fd
  }
  if (!logStream || logStream.fd !== logFD) {
    if (!ls) try { ls = new net.Stream(logFD) } catch (ex) {}
    if (!ls || !ls.writable) return cb && cb() || true
    logStream = ls
  }

  if (!isFinite(level) || level < show) return cb && cb()
  // console.error("level, showlevel, show", level, show, (level >= show))
  pref = colorize("npm", COLOR.npm)
       + (COLOR[level] ? " "+colorize(
           (LEVEL[level]+spaces).substr(0,4), COLOR[level]) : "")
       + (pref && COLOR.pref ? " " + colorize(pref, COLOR.pref) : "")
  if (msg.indexOf("\n") !== -1) {
    msg = msg.split(/\n/).join("\n"+pref+" ")
  }
  msg = pref+" "+msg
  logStream.write(msg.split(/\n/).join("\r\n") + "\r\n")
  var flushed = logStream.flush()
  if (!cb) return flushed
  else if (flushed) cb()
  else logStream.on("drain", function D () {
    logStream.removeListener(D)
    cb()
  })
  return flushed
}
var spaces = "    "
log.er = function (cb, msg) {
  if (!msg) throw new Error(
    "Why bother logging it if you're not going to print a message?")
  return function (er) {
    if (er) log.error(msg)
    cb.apply(this, arguments)
  }
}
