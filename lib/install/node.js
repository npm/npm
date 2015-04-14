'use strict'

var defaultTemplate = {
  package: {
    dependencies: {},
    devDependencies: {},
    _requiredBy: [],
    _phantomChildren: {}
  },
  loaded: false,
  children: [],
  requires: [],
  requiredBy: [],
  missingDeps: {},
  path: null,
  realpath: null
}

function isLink (node) {
  return node && (node.path !== node.realpath || node.target)
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
  child.requires = []
  child.requiredBy = []
  child.package._phantomChildren = {}
  child.missingDeps = {}
  child.children.forEach(reset)
}
