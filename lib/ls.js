// show the installed versions of packages
//
// --parseable creates output like this:
// <fullpath>:<name@ver>:<realpath>:<flags>
// Flags are a :-separated list of zero or more indicators

module.exports = exports = ls

var npm = require('./npm.js')
var logicalTree = require('./install/logical-tree.js')
var readPackageTree = require('read-package-tree')
var path = require('path')
var archy = require('archy')
var semver = require('semver')
var url = require('url')
var color = require('ansicolors')
var npa = require('npm-package-arg')
var iferr = require('iferr')
var without = require('lodash.without')

ls.usage = 'npm ls'

ls.completion = require('./utils/completion/installed-deep.js')

function ls (args, silent, cb) {
  if (typeof cb !== 'function') {
    cb = silent
    silent = false
  }

  var dir = path.resolve(npm.dir, '..')

  // npm ls 'foo@~1.3' bar 'baz@<2'
  if (!args) args = []
  else args = args.map(function (a) {
    var p = npa(a)
    var name = p.name
    var ver = semver.validRange(p.rawSpec) || ''

    return [ name, ver ]
  })

  readPackageTree(dir, iferr(cb, function (physicalTree) {
    var tree = logicalTree(physicalTree)
    if (!tree.package) tree.package = {}
    pruneNestedExtraneous(tree)
    var bfs = bfsify(tree, args)
    var lite = getLite(bfs)
    if (silent) return cb(null, tree, lite)

    var long = npm.config.get('long')
    var json = npm.config.get('json')
    var out
    if (json) {
      var seen = []
      var d = long ? bfs : lite
      // the raw tree can be circular
      out = JSON.stringify(d, function (k, o) {
        if (typeof o === 'object') {
          if (-1 !== seen.indexOf(o)) return '[Circular]'
          seen.push(o)
        }
        return o
      }, 2)
    } else if (npm.config.get('parseable')) {
      out = makeParseable(bfs, long, dir)
    } else if (tree) {
      out = makeArchy(bfs, long, dir)
    }
    console.log(out)

    if (args.length && !tree.package._found) process.exitCode = 1

    // if any errors were found, then complain and exit status 1
    if (lite.problems && lite.problems.length) {
      cb(lite.problems.join('\n'), tree, lite)
    } else {
      cb(null, tree, lite)
    }
  }))
}

function pruneNestedExtraneous (data, visited) {
  visited = visited || []
  visited.push(data)
  for (var ii = 0; ii < data.children.length; ++ii) {
    if (data.children[ii].extraneous) {
      data.children[ii].children = {}
    } else if (visited.indexOf(data.children[ii]) === -1) {
      pruneNestedExtraneous(data.children[ii], visited)
    }
  }
}

function alphasort (aa, bb) {
  aa = aa.toLowerCase()
  bb = bb.toLowerCase()
  return aa > bb ? 1
       : aa < bb ? -1 : 0
}
function alphasortpackage (aa, bb) {
  return alphasort(aa.package.name, bb.package.name)
}

function getLite (data, noname) {
  var lite = {}

  if (!noname && data.name) lite.name = data.name
  if (data.version) lite.version = data.version
  if (data.extraneous) {
    lite.extraneous = true
    lite.problems = lite.problems || []
    lite.problems.push(
      'extraneous: ' + data.name + '@' + data.version + ' ' + (data.path || '')
    )
  }

  if (data.package._from)
    lite.from = data.package._from

  if (data.package._resolved)
    lite.resolved = data.package._resolved

  if (data.invalid) {
    lite.invalid = true
    lite.problems = lite.problems || []
    lite.problems.push(
      'invalid: ' + data.name + '@' + data.version + ' ' + (data.path || '')
    )
  }

  if (data.peerInvalid) {
    lite.peerInvalid = true
    lite.problems = lite.problems || []
    lite.problems.push(
      'peer invalid: ' + data.name + '@' + data.version + ' ' + (data.path || '')
    )
  }

  var deps = data.children.sort(alphasortpackage)
  if (deps.length) lite.children = deps.map(function (dep) {
    return [dep.package.name, getLite(dep, true)]
  }).reduce(function (deps, d) {
    if (d[1].problems) {
      lite.problems = lite.problems || []
      lite.problems.push.apply(lite.problems, d[1].problems)
    }
    deps[d[0]] = d[1]
    return deps
  }, {})
  return lite
}

function bfsify (root, args, current, queue, seen) {
  // walk over the data, and turn it from this:
  // +-- a
  // |   `-- b
  // |       `-- a (truncated)
  // `--b (truncated)
  // into this:
  // +-- a
  // `-- b
  // which looks nicer
  args = args || []
  current = current || root
  queue = queue || []
  seen = seen || [root]
  var deps = (current.children = current.children || []).sort(alphasortpackage)
  deps.forEach(function (dep) {
    if (typeof dep !== 'object') return
    if (seen.indexOf(dep) !== -1) {
      current.children = current.children.filter(function (child) { return child.package.name !== dep.package.name })
      if (npm.config.get('parseable') || !npm.config.get('long')) return
      dep = Object.create(dep)
      dep.children = []
      current.children.push(dep)
    }
    queue.push(dep)
    seen.push(dep)
  })

  if (!queue.length) {
    // if there were args, then only show the paths to found nodes.
    return filterFound(root, args)
  }
  return bfsify(root, args, queue.shift(), queue, seen)
}

function filterFound (root, args) {
  if (!args.length) return root
  var deps = root.children
  if (deps) deps.forEach(function (rawDep) {
    var dep = filterFound(rawDep, args)

    // see if this one itself matches
    var found = false
    for (var i = 0; !found && i < args.length; i++) {
      if (dep.package.name === args[i][0]) {
        found = semver.satisfies(dep.version, args[i][1], true)
      }
    }
    // included explicitly
    if (found) dep.package._found = true
    // included because a child was included
    if (dep.package._found && !root.package._found) root.package._found = 1
    // not included
    if (!dep.package._found) deps = without(deps, dep)
  })
  if (!root.package._found) root.package._found = false
  return root
}

function makeArchy (data, long, dir) {
  var out = makeArchy_(data, long, dir, 0)
  return archy(out, '', { unicode: npm.config.get('unicode') })
}

function makeArchy_ (data, long, dir, depth, parent, d) {
  var out = {}
  // the top level is a bit special.
  out.label = data.package._id || ''
  if (data.package._found === true && data.package._id) {
    if (npm.color) {
      out.label = color.bgBlack(color.yellow(out.label.trim())) + ' '
    } else {
      out.label = out.label.trim() + ' '
    }
  }
  if (data.link) out.label += ' -> ' + data.link

  if (data.invalid) {
    if (data.realName !== data.name) out.label += ' (' + data.realName + ')'
    var invalid = 'invalid'
    if (npm.color) invalid = color.bgBlack(color.red(invalid))
    out.label += ' ' + invalid
  }

  if (data.peerInvalid) {
    var peerInvalid = 'peer invalid'
    if (npm.color) peerInvalid = color.bgBlack(color.red(peerInvalid))
    out.label += ' ' + peerInvalid
  }

  if (data.extraneous && data.path !== dir) {
    var extraneous = 'extraneous'
    if (npm.color) extraneous = color.bgBlack(color.green(extraneous))
    out.label += ' ' + extraneous
  }

  // add giturl to name@version
  if (data.package._resolved) {
    if (npa(data.package._resolved).type === 'git')
      out.label += ' (' + data.package._resolved + ')'
  }

  if (long) {
    if (dir === data.path) out.label += '\n' + dir
    out.label += '\n' + getExtras(data, dir)
  } else if (dir === data.path) {
    if (out.label) out.label += ' '
    out.label += dir
  }

  // now all the children.
  out.nodes = []
  if (depth <= npm.config.get('depth')) {
    out.nodes = (data.children || [])
      .sort(alphasortpackage).map(function (dep) {
        return makeArchy_(dep, long, dir, depth + 1, data, dep.package.name)
      })
  }

  if (out.nodes.length === 0 && data.path === dir) {
    out.nodes = ['(empty)']
  }

  return out
}

function getExtras (data) {
  var extras = []

  if (data.package.description) extras.push(data.package.description)
  if (data.package.repository) extras.push(data.package.repository.url)
  if (data.package.homepage) extras.push(data.package.homepage)
  if (data.package._from) {
    var from = data.package._from
    if (from.indexOf(data.package.name + '@') === 0) {
      from = from.substr(data.package.name.length + 1)
    }
    var u = url.parse(from)
    if (u.protocol) extras.push(from)
  }
  return extras.join('\n')
}

function makeParseable (data, long, dir, depth, parent, d) {
  depth = depth || 0

  return [ makeParseable_(data, long, dir, depth, parent, d) ]
  .concat((data.children || [])
    .sort(alphasortpackage)
    .map(function (dep) {
      return makeParseable(dep, long, dir, depth + 1, data, dep.package.name)
    }))
  .filter(function (x) { return x })
  .join('\n')
}

function makeParseable_ (data, long, dir, depth, parent, d) {
  if (data.hasOwnProperty('_found') && data.package._found !== true) return ''

  if (typeof data === 'string') {
    if (data.depth < npm.config.get('depth')) {
      data = npm.config.get('long') ?
             path.resolve(parent.path, 'node_modules', d) +
             ':' + d + '@' + JSON.stringify(data) + ':INVALID:MISSING' :
             ''
    } else {
      data = path.resolve(data.path || '', 'node_modules', d || '') +
               (npm.config.get('long') ?
                ':' + d + '@' + JSON.stringify(data) +
                ':' + // no realpath resolved
                ':MAXDEPTH' :
                '')
    }

    return data
  }

  if (!npm.config.get('long')) return data.path

  return data.path +
         ':' + (data.package._id || '') +
         ':' + (data.realPath !== data.path ? data.realPath : '') +
         (data.extraneous ? ':EXTRANEOUS' : '') +
         (data.invalid ? ':INVALID' : '') +
         (data.peerInvalid ? ':PEERINVALID' : '')
}
