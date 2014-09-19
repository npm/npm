var fs = require('graceful-fs')
var util = require('util')
var crypto = require('crypto')

function md5hex () {
  var hash = crypto.createHash('md5')
  for (var ii=0; ii<arguments.length; ++ii) {
    hash.update(''+arguments[ii])
  }
  return hash.digest('hex')
}

var invocations = 0;
function getTmpname (filename) {
  return filename + "." + md5hex(__filename, process.pid, ++invocations)
}

module.exports = WriteStream

util.inherits(WriteStream, fs.WriteStream)
function WriteStream (path, options) {
  if (!options)
    options = {}

  if (!(this instanceof WriteStream))
    return new WriteStream(path, options)

  this.__atomicTarget = path
  this.__atomicChown = options.chown
  this.__atomicDidStuff = false
  this.__atomicTmp = getTmpname(path)

  fs.WriteStream.call(this, this.__atomicTmp, options)
}

// When we *would* emit 'close' or 'finish', instead do our stuff
WriteStream.prototype.emit = function (ev) {
  if (this.__atomicDidStuff || (ev !== 'close' && ev !== 'finish'))
    return fs.WriteStream.prototype.emit.apply(this, arguments)

  atomicDoStuff.call(this, function (er) {
    if (er)
      this.emit('error', er)
    else
      this.emit(ev)
  }.bind(this))
}

function atomicDoStuff(cb) {
  if (this.__atomicDidStuff)
    throw new Error('Already did atomic move-into-place')

  this.__atomicDidStuff = true
  if (this.__atomicChown) {
    var uid = this.__atomicChown.uid
    var gid = this.__atomicChown.gid
    return fs.chown(this.__atomicTmp, uid, gid, function (er) {
      if (er) return cb(er)
      moveIntoPlace.call(this, cb)
    }.bind(this))
  } else {
    moveIntoPlace.call(this, cb)
  }
}

function moveIntoPlace (cb) {
  fs.rename(this.__atomicTmp, this.__atomicTarget, cb)
}
