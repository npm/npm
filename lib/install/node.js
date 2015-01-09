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
  missingDeps: {},
  path: null,
  realpath: null
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
  return node
}
var reset = exports.reset = function (node) {
  if (node.parent && !node.parent.parent && node.package && !node.package._requiredBy) node.package._requiredBy = ['#EXISTING']
  var child = create(node)
  child.package._requiredBy = child.package._requiredBy.filter(function (req) {
    return req[0] === '#'
  })
  child.requires = []
  child.package._phantomChildren = {}
  child.missingDeps = {}
  child.children.forEach(reset)
}
