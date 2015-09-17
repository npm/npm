'use strict'
var safe = require('../utils/safe.js')

var defaultTemplate = {
  package: {
    version: '',
    dependencies: {},
    devDependencies: {},
    optionalDependencies: {}
  },
  loaded: false,
  children: [],
  requiredBy: [],
  requires: [],
  missingDeps: {},
  missingDevDeps: {},
  phantomChildren: {},
  path: null,
  realpath: null,
  location: null,
  userRequired: false,
  existing: false,
  isTop: false
}

function isLink (node) {
  return node && node.isLink
}


var create = exports.create = safe.recurseLimitSync(10, 100, function (node, template, $$recurse$$) {
  if (!$$recurse$$) {
    $$recurse$$ = template
    template = defaultTemplate
  }
  Object.keys(template).forEach(function (key) {
    if (template[key] != null && typeof template[key] === 'object' && !(template[key] instanceof Array)) {
      if (!node[key]) node[key] = {}
      return $$recurse$$(node[key], template[key])
    }
    if (node[key] != null) return
    node[key] = template[key]
  })
  if (isLink(node.parent)) {
    node.isLink = true
  }
  return node
})

exports.reset = function (node) {
  reset(node, {})
}

var reset = safe.recurseLimitSync(1000, 10000, function (node, seen, $$recurse$$) {
  if (seen[node.path]) return
  seen[node.path] = true
  var child = create(node)

  // FIXME: cleaning up after read-package-json's mess =(
  if (child.package._id === '@') delete child.package._id

  child.isTop = false
  child.requiredBy = []
  child.requires = []
  child.missingDeps = {}
  child.missingDevDeps = {}
  child.phantomChildren = {}
  child.location = null

  child.children.forEach(function (child) { $$recurse$$(child, seen) })
  if (!child.package.version) child.package.version = ''
})
