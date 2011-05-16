
// Walk through the file-system "database" of installed
// packages, and create a data object related to the
// installed versions of each package.

/*
This will traverse through all node_modules folders,
resolving the dependencies object to the object corresponding to
the package that meets that dep, or just the version/range if
unmet.

Assuming that you had this folder structure:

/path/to
+-- package.json { name = "root" }
`-- node_modules
    +-- foo {bar, baz, asdf}
    | +-- node_modules
    |   +-- bar { baz }
    |   `-- baz
    `-- asdf

where "foo" depends on bar, baz, and asdf, bar depends on baz,
and bar and baz are bundled with foo, whereas "asdf" is at
the higher level (sibling to foo), you'd get this object structure:

{ <package.json data>
, path: "/path/to"
, parent: null
, dependencies:
  { foo :
    { version: "1.2.3"
    , path: "/path/to/node_modules/foo"
    , parent: <Circular: root>
    , dependencies:
      { bar:
        { parent: <Circular: foo>
        , path: "/path/to/node_modules/foo/node_modules/bar"
        , version: "2.3.4"
        , dependencies: { baz: <Circular: foo.dependencies.baz> }
        }
      , baz: { ... }
      , asdf: <Circular: asdf>
      }
    }
  , asdf: { ... }
  }
}

Unmet deps are left as strings.
Extraneous deps are marked with extraneous:true
deps that don't meet a requirement are marked with invalid:true

to READ(packagefolder, parentobj, name, reqver)
obj = read package.json
installed = ./node_modules/*
if parentobj is null, and no package.json
  obj = {dependencies:{<installed>:"*"}}
deps = Object.keys(obj.dependencies)
obj.path = packagefolder
obj.parent = parentobj
if name, && obj.name !== name, obj.invalid = true
if reqver, && obj.version !satisfies reqver, obj.invalid = true
if !reqver && parentobj, obj.extraneous = true
for each folder in installed
  obj.dependencies[folder] = READ(packagefolder+node_modules+folder,
                                  obj, folder, obj.dependencies[folder])
# walk tree to find unmet deps
for each dep in obj.dependencies not in installed
  r = obj.parent
  while r
    if r.dependencies[dep]
      if r.dependencies[dep].verion !satisfies obj.dependencies[dep]
        WARN
        r.dependencies[dep].invalid = true
      obj.dependencies[dep] = r.dependencies[dep]
      r = null
    else r = r.parent
return obj

*/


var npm = require("../../npm")
  , fs = require("./graceful-fs")
  , path = require("path")
  , asyncMap = require("./async-map")
  , semver = require("semver")
  , readJson = require("./read-json")
  , log = require("./log")

module.exports = readInstalled

function readInstalled (folder, cb) {
  var d = npm.config.get("depth")
  readInstalled_(folder, null, null, null, 0, d, function (er, obj) {
    if (er) return cb(er)
    // now obj has all the installed things, where they're installed
    // figure out the inheritance links, now that the object is built.
    resolveInheritance(obj)
    cb(null, obj)
  })
}

var rpSeen = {}
function readInstalled_ (folder, parent, name, reqver, depth, maxDepth, cb) {
  //console.error(folder, name)

  var installed
    , obj
    , real
    , link

  fs.readdir(path.resolve(folder, "node_modules"), function (er, i) {
    // error indicates that nothing is installed here
    if (er) i = []
    installed = i.filter(function (f) { return f.charAt(0) !== "." })
    next()
  })

  readJson(path.resolve(folder, "package.json"), function (er, data) {
    obj = data
    if (!parent) obj = obj || true
    return next(er)
  })

  fs.lstat(folder, function (er, st) {
    if (er) {
      if (!parent) real = true
      return next(er)
    }
    fs.realpath(folder, function (er, rp) {
      //console.error("realpath(%j) = %j", folder, rp)
      real = rp
      if (st.isSymbolicLink()) link = rp
      next(er)
    })
  })

  var errState = null
    , called = false
  function next (er) {
    if (errState) return
    if (er) {
      if (!parent) obj = true
      else {
        errState = er
        return cb(null, [])
      }
    }
    //console.error('next', installed, obj && typeof obj, name, real)
    if (!installed || !obj || !real || called) return
    called = true
    if (rpSeen[real]) return cb(null, rpSeen[real])
    if (obj === true) {
      obj = {dependencies:{}, path:folder}
      installed.forEach(function (i) { obj.dependencies[i] = "*" })
    }
    if (name && obj.name !== name) obj.invalid = true
    obj.realName = name || obj.name
    obj.dependencies = obj.dependencies || {}
    if (reqver && !semver.satisfies(obj.version, reqver)) obj.invalid = true
    if (parent
        && !(name in parent.dependencies)
        && !(name in (parent.devDependencies || {}))) {
      obj.extraneous = true
    }
    obj.path = obj.path || folder
    obj.realPath = real
    obj.link = link
    if (parent && !obj.link) obj.parent = parent
    rpSeen[real] = obj
    obj.depth = depth
    if (depth >= maxDepth) return cb(null, obj)
    asyncMap(installed, function (pkg, cb) {
      var rv = obj.dependencies[pkg]
      if (!rv && obj.devDependencies) rv = obj.devDependencies[pkg]
      readInstalled_( path.resolve(folder, "node_modules/"+pkg)
                    , obj, pkg, obj.dependencies[pkg], depth + 1, maxDepth
                    , cb )
    }, function (er, installedData) {
      if (er) return cb(er)
      installedData.forEach(function (dep) {
        obj.dependencies[dep.realName] = dep
      })
      return cb(null, obj)
    })
  }
}

// starting from a root object, call findUnmet on each layer of children
var riSeen = []
function resolveInheritance (obj) {
  if (typeof obj !== "object") return
  if (riSeen.indexOf(obj) !== -1) return
  riSeen.push(obj)
  if (typeof obj.dependencies !== "object") {
    obj.dependencies = {}
  }
  Object.keys(obj.dependencies).forEach(function (dep) {
    findUnmet(obj.dependencies[dep])
  })
  Object.keys(obj.dependencies).forEach(function (dep) {
    resolveInheritance(obj.dependencies[dep])
  })
}

// find unmet deps by walking up the tree object.
// No I/O
var fuSeen = []
function findUnmet (obj) {
  if (fuSeen.indexOf(obj) !== -1) return
  fuSeen.push(obj)
  //console.error("find unmet", obj.name, obj.parent && obj.parent.name)
  var deps = obj.dependencies = obj.dependencies || {}
  //console.error(deps)
  Object.keys(deps)
    .filter(function (d) { return typeof deps[d] === "string" })
    .forEach(function (d) {
      //console.error("find unmet", obj.name, d, deps[d])
      var r = obj.parent
        , found = null
      while (r && !found && typeof deps[d] === "string") {
        // if r is a valid choice, then use that.
        found = r.dependencies[d]
        if (!found && r.realName === d) found = r

        if (!found) {
          r = r.link ? null : r.parent
          continue
        }
        if ( typeof deps[d] === "string"
            && !semver.satisfies(found.version, deps[d])) {
          // the bad thing will happen
          log.warn(obj.path + " requires "+d+"@'"+deps[d]
                  +"' but will load\n"
                  +found.path+",\nwhich is version "+found.version
                  ,"unmet dependency")
          found.invalid = true
        }
        deps[d] = found
      }
    })
  log.verbose([obj._id], "returning")
  return obj
}

if (module === require.main) {
  var util = require("util")
  console.error("testing")

  var called = 0
  readInstalled(process.cwd(), function (er, map) {
    console.error(called ++)
    if (er) return console.error(er.stack || er.message)
    cleanup(map)
    console.error(util.inspect(map, true, 10, true))
  })

  var seen = []
  function cleanup (map) {
    if (seen.indexOf(map) !== -1) return
    seen.push(map)
    for (var i in map) switch (i) {
      case "_id":
      case "path":
      case "extraneous": case "invalid":
      case "dependencies": case "name":
        continue
      default: delete map[i]
    }
    var dep = map.dependencies
//    delete map.dependencies
    if (dep) {
//      map.dependencies = dep
      for (var i in dep) if (typeof dep[i] === "object") {
        cleanup(dep[i])
      }
    }
    return map
  }
}
