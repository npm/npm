'use strict'
// wrapper around mkdirp for tar's needs.
const mkdirp = require('mkdirp')
const fs = require('fs')
const path = require('path')

class SymlinkError extends Error {
  constructor (symlink, path) {
    super('Cannot extract through symbolic link')
    this.path = path
    this.symlink = symlink
  }

  get name () {
    return 'SylinkError'
  }
}

const mkdir = module.exports = (dir, opt, cb) => {
  const mode = opt.mode | 0o0700
  const preserve = opt.preserve
  const unlink = opt.unlink
  const cache = opt.cache
  const cwd = opt.cwd

  const done = er => {
    if (!er)
      cache.set(dir, true)
    cb(er)
  }

  if (cache && cache.get(dir) === true || dir === cwd)
    return cb()

  if (preserve)
    return mkdirp(dir, mode, done)

  const sub = path.relative(cwd, dir)
  const parts = sub.split(/\/|\\/)
  mkdir_(cwd, parts, mode, cache, unlink, done)
}

const mkdir_ = (base, parts, mode, cache, unlink, cb) => {
  if (!parts.length)
    return cb()
  const p = parts.shift()
  const part = base + '/' + p
  if (cache.get(part))
    return mkdir_(part, parts, mode, cache, unlink, cb)
  fs.mkdir(part, mode, onmkdir(part, parts, mode, cache, unlink, cb))
}

const onmkdir = (part, parts, mode, cache, unlink, cb) => er => {
  if (er) {
    fs.lstat(part, (statEr, st) => {
      if (statEr)
        cb(statEr)
      else if (st.isDirectory())
        mkdir_(part, parts, mode, cache, unlink, cb)
      else if (unlink)
        fs.unlink(part, er => {
          if (er)
            return cb(er)
          fs.mkdir(part, mode, onmkdir(part, parts, mode, cache, unlink, cb))
        })
      else if (st.isSymbolicLink())
        return cb(new SymlinkError(part, part + '/' + parts.join('/')))
      else
        cb(er)
    })
  } else
    mkdir_(part, parts, mode, cache, unlink, cb)
}

const mkdirSync = module.exports.sync = (dir, opt) => {
  const mode = opt.mode | 0o0700
  const preserve = opt.preserve
  const unlink = opt.unlink
  const cache = opt.cache
  const cwd = opt.cwd

  if (cache && cache.get(dir) === true || dir === cwd)
    return

  if (preserve) {
    mkdirp.sync(dir, mode)
    cache.set(dir, true)
    return
  }

  const sub = path.relative(cwd, dir)
  const parts = sub.split(/\/|\\/)
  for (let p = parts.shift(), part = cwd;
       p && (part += '/' + p);
       p = parts.shift()) {

    if (cache.get(part))
      continue

    try {
      fs.mkdirSync(part, mode)
      cache.set(part, true)
    } catch (er) {
      const st = fs.lstatSync(part)
      if (st.isDirectory()) {
        cache.set(part, true)
        continue
      } else if (unlink) {
        fs.unlinkSync(part)
        fs.mkdirSync(part, mode)
        cache.set(part, true)
        continue
      } else if (st.isSymbolicLink())
        return new SymlinkError(part, part + '/' + parts.join('/'))
    }
  }
  cache.set(dir, true)
}
