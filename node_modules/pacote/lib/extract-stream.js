'use strict'

const tar = require('tar')

module.exports = extractStream
function extractStream (dest, opts, cb) {
  opts = opts || {}
  return tar.x({
    cwd: dest,
    filter: (name, entry) => !entry.header.type.match(/^.*link$/i),
    strip: 1,
    onwarn: msg => opts.log && opts.log.warn('tar', msg),
    uid: opts.uid,
    gid: opts.gid,
    onentry (entry) {
      if (entry.type.toLowerCase() === 'file') {
        entry.mode = opts.fmode & ~(opts.umask || 0)
      } else if (entry.type.toLowerCase() === 'directory') {
        entry.mode = opts.dmode & ~(opts.umask || 0)
      }
    }
  })
}
