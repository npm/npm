'use strict'
module.exports = function (tree) {
  var pkg = tree.package || tree
  // FIXME: Excluding the '@' here is cleaning up after the mess that
  // read-package-json makes. =(
  if (pkg._id && pkg._id !== '@') return pkg._id
  if (pkg.name && pkg.version) {
    return pkg.name + '@' + pkg.version
  } else if (tree) {
    return tree.path
  } else if (pkg.name) {
    return pkg.name
  } else {
    return ''
  }
}
