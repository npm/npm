var fs = require ('fs')
var rpj = require ('read-package-json')
var path = require ('path')
var dz = require ('dezalgo')
var once = require ('once')
var readdir = require ('readdir-scoped-modules')
var debug = require ('debuglog') ('rpt')

function dpath (p) {
  if (p . indexOf (process.cwd()) === 0)
    p = p . substr (process.cwd().length + 1)
  return p
}

module . exports = rpt

rpt . Node = Node
rpt . Link = Link

var ID = 0
function Node (package, path, cache) {
  if (cache [path])
    return cache [path]

  if (! (this instanceof Node))
    return new Node (package, path, cache)

  cache [path] = this

  debug (this . constructor . name, dpath (path), package && package . _id)

  this . id = ID ++
  this . package = package
  this . path = path
  this . realpath = path
  this . parent = null
  this . children = []
}
Node . prototype . package = null
Node . prototype . path = ''
Node . prototype . realpath = ''
Node . prototype . children = null



function Link (package, path, realpath, cache) {
  if (cache [path])
    return cache [path]

  if (! (this instanceof Link))
    return new Link (package, path, realpath)

  cache [path] = this

  debug (this . constructor . name, dpath (path), package && package . _id)

  this . id = ID ++
  this . path = path
  this . realpath = realpath
  this . package = package
  this . parent = null
  this . target = new Node (package, realpath, cache)
  this . children = this . target . children
}
Link . prototype = Object . create (Node . prototype, {
  constructor : { value : Link }
})
Link . prototype . target = null
Link . prototype . realpath = ''



function loadNode (p, cache, cb) {
  debug ('loadNode', dpath (p))
  fs . realpath (p, function (er, real) {
    if (er)
      return cb (er)
    debug ('realpath p=%j real=%j', dpath (p), dpath (real))
    var pj = path . resolve (real, 'package.json')
    rpj (pj, function (er, package) {
      package = package || null
      var n
      if (p === real)
        n = new Node (package, real, cache)
      else
        n = new Link (package, p, real, cache)

      cb (er, n)
    })
  })
}

function loadChildren (node, cache, cb) {
  debug ('loadChildren', dpath(node . path))
  // don't let it be called more than once
  cb = once (cb)
  var nm = path . resolve (node . path, 'node_modules')
  readdir (nm, function (er, kids) {
    // If there are no children, that's fine, just return
    if (er)
      return cb (null, node)

    kids = kids . filter (function (kid) {
      return kid[0] !== '.'
    })

    var l = kids . length
    if (l === 0)
      return cb (null, node)

    kids . forEach (function (kid) {
      var p = path . resolve (nm, kid)
      loadNode (p, cache, then)
    })

    function then (er, kid) {
      if (er)
        return cb (er)
      node . children . push (kid)
      kid . parent = node
      if (-- l === 0) {
        sortChildren (node)
        return cb (null, node)
      }
    }
  })
}

function sortChildren (node) {
  node . children = node . children . sort (function (a, b) {
    a = a . package . name . toLowerCase ()
    b = b . package . name . toLowerCase ()
    return a > b ? 1 : -1
  })
}

function loadTree (node, did, cache, cb) {
  debug ('loadTree', dpath (node . path), !! cache [ node . path ])

  if (did [ node . realpath ]) {
    return dz (cb) (null, node)
  }

  did [ node . realpath ] = true

  cb = once (cb)
  loadChildren (node, cache, function (er, node) {
    if (er)
      return cb (er)

    var kids = node . children . filter (function (kid) {
      return !did [ kid . realpath ]
    })

    var l = kids . length
    if (l === 0)
      return cb (null, node)

    kids . forEach (function (kid, index) {
      loadTree (kid, did, cache, then)
    })

    function then (er, kid) {
      if (er)
        return cb (er)

      if (--l === 0)
        cb (null, node)
    }
  })
}

function rpt (root, cb) {
  root = path . resolve (root)
  debug ('rpt', dpath (root))
  var cache = Object . create (null)
  loadNode (root, cache, function (er, node) {
    // if there's an error, it's fine, as long as we got a node
    if (!node)
      return cb (er)
    loadTree (node, {}, cache, function (lter, tree) {
      cb(er && er.code !== "ENOENT" ? er : lter, tree)
    })
  })
}
