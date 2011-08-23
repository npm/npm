
// centralized stdout writer.

exports.doColor = doColor
exports.write = write

var npm = require("../../npm.js")
  , stdio = process.binding("stdio")
  , streams = {}
  , ttys = {}
  , net = require("net")
  , util = require("util")
  , deadStreams = {}

function doColor (stream) {
  var conf = npm.config.get("color")
  return (!conf) ? false
       : (conf === "always") ? true
       : isatty(stream)
}
function isatty (stream) {
  if (!stdio.isatty) return true
  if (stream && stream.fd) stream = stream.fd
  if (stream in ttys) return ttys[stream]
  return ttys[stream] = stdio.isatty(stream)
}

function write (args, stream, lf, cb) {
  if (typeof cb !== "function" && typeof lf === "function") {
    cb = lf
    lf = null
  }
  if (typeof cb !== "function" && typeof stream === "function") {
    cb = stream
    stream = npm.config.get("outfd")
  }

  stream = getStream(stream)
  if (lf == null) lf = isatty(stream)
  if (!stream) return cb && cb(), false
  if (!Array.isArray(args)) args = [args]

  var msg = ""
    , colored = doColor(stream)
  msg = args.map(function (arg) {
    if (typeof arg !== "string") {
      return util.inspect(arg, false, 5, colored) + "\n"
    }
    if (!colored) arg = arg.replace(/\033\[[0-9;]*m/g, '')
    if (!npm.config.get("unicode")) {
      arg = arg.replace(/└/g, "`")
               .replace(/─/g, "-")
               .replace(/├/g, "+")
               .replace(/┬/g, "-")
    }
    return arg
  }).join(" ")

  // listen to the "output" event to cancel/modify/redirect
  npm.output = {stream:stream, message:msg}
  npm.emit("output", npm.output)
  if (!npm.output) return cb && cb(), false // cancelled
  stream = npm.output.stream
  msg = npm.output.message

  // EPIPE errors just mean that the stream is not listening
  // any more.  Mark the stream as dead, and return.
  if (deadStreams[stream.fd]) {
    return cb && cb(), false
  }
  if (!deadStreams.hasOwnProperty(stream.fd)) {
    deadStreams[stream.fd] = false
    stream.on("error", function (er) {
      if (er.code === "EPIPE") {
        deadStreams[stream.fd] = true
        return cb && cb()
      }
      if (stream.listeners("error").length === 1) {
        throw er
      }
    })
  }

  // use the \r\n in case we're in raw mode.
  msg = msg.split(/\r?\n/).concat("").join(lf ? "\r\n" : "\n")
  // output to stderr should be synchronous
  if (stream.fd === stdio.stderrFD) {
    stdio.writeError(msg)
    if (cb) cb()
    return true
  }
  var flushed = stream.write(msg)
  if (flushed && cb) {
    process.nextTick(cb)
  } else {
    stream.on("drain", cb)
  }
  return flushed
}

var hadError = false
function getStream (fd) {
  if (hadError) return

  var stream
  if (!fd && fd !== 0) return
  if (typeof fd === "string") fd = +fd

  if (fd && typeof fd === "object") {
    stream = fd
    fd = fd.fd
  } else if (streams[fd]) {
    stream = streams[fd]
  } else {
    var stdio = process.binding("stdio")
    switch (fd) {
      case stdio.stdoutFD: stream = process.stdout; break
      case stdio.stderrFD: stream = process.stderr; break
      default:
        try {
          stream = new net.Stream(fd)
          if (!stream || !stream.writable) {
            throw new Error("Stream not writable")
          }
        } catch (ex) {
          // if this fails, then regular logging is most likely broken.
          var er = new Error("cannot output to fd "+fd + ": "+
                             (ex.stack || ex.message).substr(7) + "\n")
          console.error(er.stack)
          hadError = true
          process.exit(1)
        }
    }
  }

  if (!stream || !stream.writable) return
  return streams[fd] = stream
}
