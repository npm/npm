
// centralized stdout writer.

exports.doColor = doColor
exports.write = write

var npm = require("../../npm")
  , stdio = process.binding("stdio")
  , streams = {}
  , ttys = {}
  , net = require("net")
  , sys = require("./sys")

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

function write (stream, args, lf, cb) {
  stream = getStream(stream)
  if (!cb && typeof lf === "function") cb = lf , lf = isatty(stream)
  if (!stream) return cb && cb()
  if (!Array.isArray(args)) args = [args]
  var msg = ""
    , colored = doColor(stream)
  args.forEach(function (arg) {
    msg += " "
    if (typeof arg !== "string") {
      msg += sys.inspect(arg, false, 5, colored) + "\n"
    } else {
      if (!colored) arg = arg.replace(/\033\[[0-9;]*m/g, '')
      msg += arg
    }
  })

  // listen to the "output" event to cancel/modify/redirect
  npm.output = {stream:stream, message:msg}
  npm.emit("output", npm.output)
  if (!npm.output) return cb(), false // cancelled
  stream = npm.output.stream
  msg = npm.output.message

  // use the \r\n in case we're in raw mode.
  msg = (msg.trim() + "\n").split(/\r?\n/).join(lf ? "\r\n" : "\n")
  // output to stderr should be synchronous
  if (stream.fd === stdio.stderrFD) {
    stdio.writeError(msg)
    if (cb) cb()
    return true
  }
  var flushed = stream.write(msg)
  if (!cb) return flushed
  if (flushed) return cb(), true
  stream.on("drain", function D () {
    stream.removeListener("drain", D)
    cb()
  })
  return false
}

function getStream (fd) {
  var stream
  if (!fd && fd !== 0) return
  if (typeof fd === "string") fd = +fd
  if (fd && typeof fd === "object") {
    stream = fd
    fd = fd.fd
  } else if (streams[fd]) {
    stream = streams[fd]
  } else try {
    stream = new net.Stream(fd)
  } catch (ex) {}
  if (!stream || !stream.writable) return
  return streams[fd] = stream
}
