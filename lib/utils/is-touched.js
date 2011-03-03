// determine whether or not a folder was installed
// by npm, and if so, if it was touched.
//
// For now, just assume everything is clean.

module.exports = isTouched

function isTouched (p, cb) {
  cb(null, false)
}
