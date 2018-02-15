'use strict'
module.exports = hasModernMeta

function isLink (child) {
  return child.isLink || (child.parent && isLink(child.parent))
}

function hasModernMeta (child) {
  if (!child) return false
  return child.isTop || isLink(child) || (
    child.package &&
    child.package._resolved &&
    (child.package._integrity || child.package._shasum)
  )
}
