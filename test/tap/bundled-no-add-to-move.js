'use strict'
var test = require('tap').test
var Node = require('../../lib/install/node.js').create
var diffTrees = require('../../lib/install/diff-trees.js')._diffTrees
var sortActions = require('../../lib/install/diff-trees.js').sortActions

var oldTree = Node({
  path: '/',
  children: [
    Node({
      package: {name: 'one', version: '1.0.0', _location: '/one'},
      path:'/one'
    })
  ]
})
oldTree.children[0].requiredBy.push(oldTree)

var newTree = Node({
  path: '/',
  children: [
    Node({
      package: {name: 'abc', version: '1.0.0', _location: '/abc'},
      path: '/abc',
      children: [
        Node({
          package: {name: 'one', version: '1.0.0', _location: '/abc/one'},
          fromBundle: true,
          path: '/one'
        })
      ]
    })
  ]
})
newTree.children[0].requiredBy.push(newTree)
newTree.children[0].children[0].requiredBy.push(newTree.children[0])

test('test', function (t) {
  var differences = sortActions(diffTrees(oldTree, newTree)).map(function (diff) { return diff[0] + diff[1].path })
  t.isDeeply(differences, ['add/abc', 'add/one', 'remove/one'], 'bundled add/remove stays add/remove')
  t.end()
})
