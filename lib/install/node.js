'use strict'

var defaultTemplate = {
  package: {
    dependencies: {},
    devDependencies: {},
    optionalDependencies: {},
    _requiredBy: [],
    _phantomChildren: {}
  },
  loaded: false,
  children: [],
  requiredBy: [],
  missingDeps: {},
  missingDevDeps: {},
  path: null,
  realpath: null
}

function isLink (node) {
  return node && node.isLink
}

var create = exports.create = function (node, template) {
  if (!template) template = defaultTemplate
  Object.keys(template).forEach(function (key) {
    if (template[key] != null && typeof template[key] === 'object' && !(template[key] instanceof Array)) {
      if (!node[key]) node[key] = {}
      return create(node[key], template[key])
    }
    if (node[key] != null) return
    node[key] = template[key]
  })
  if (isLink(node) || isLink(node.parent)) {
    node.isLink = true
  }
  return node
}
var reset = exports.reset = function (node) {
  var child = create(node)
  child.package._requiredBy = child.package._requiredBy.filter(function (req) {
    return req[0] === '#'
  })
  child.requiredBy = []
  child.package._phantomChildren = {}
  child.missingDeps = {}
  child.children.forEach(reset)
  if (!child.package._id && child.package.name) {
    child.package._id = child.package.name + (child.package.version != null ? '@' + child.package.version : '')
  }
  if (!child.package.version) child.package.version = ''
}
