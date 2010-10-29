
// centralized stdout writer.

exports.doColor = doColor
exports.write = write

var npm = require("../../npm")
  , stdio = process.binding("stdio")
  , streams = {}
  , colored = {}
  , net = require("net")
  , sys = require("./sys")

function doColor (stream) {
  if (!npm.config.get("color")) return false
  if (!stdio.isatty) return true
  if (stream && stream.fd) stream = stream.fd
  if (stream in colored) return colored[stream]
  return colored[stream] = stdio.isatty(stream)
}

function write (stream, args, lf, cb) {
  if (!cb && typeof lf === "function") cb = lf , lf = true
  stream = getStream(stream)
  if (!stream) return
  if (!Array.isArray(args)) args = [args]
  var msg = ""
    , colored = doColor(stream)
  args.forEach(function (arg) {
    msg += " "
    if (typeof arg !== "string") {
      msg += sys.inspect(arg, false, 5, colored) + "\n"
    } else {
      if (!colored) arg = arg.replace(/\033\[[0-9;]+m/g, '')
      msg += arg
    }
  })
  // use the \r\n in case we're in raw mode.
  msg = (msg.trim() + "\n").split(/\r?\n/).join(lf ? "\r\n" : "\n")
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
