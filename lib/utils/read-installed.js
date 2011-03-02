
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
  readInstalled_(folder, null, null, null, function (er, obj) {
    if (er) return cb(er)
    // now obj has all the installed things, where they're installed
    // figure out the inheritance links, now that the object is built.
    resolveInheritance(obj)
    cb(null, obj)
  })
}

function readInstalled_ (folder, parent, name, reqver, cb) {
  if (typeof cb !== "function") cb = reqver, reqver = null
  if (typeof cb !== "function") cb = name, name = null
  if (typeof cb !== "function") cb = parent, parent = null

//  console.error(folder, name)

  var installed
    , obj

  fs.readdir(path.resolve(folder, "node_modules"), function (er, i) {
    // error indicates that nothing is installed here
    if (er) i = []
    installed = i.filter(function (f) { return f.charAt(0) !== "." })
    next()
  })

  readJson(path.resolve(folder, "package.json"), function (er, data) {
    obj = data
    if (er) {
      if (parent) return cb(er)
      obj = true
    }
    return next()
  })

  function next () {
    //console.error('next', installed, obj && typeof obj, name)
    if (!installed || !obj) return
    if (obj === true) {
      obj = {dependencies:{}}
      installed.forEach(function (i) { obj.dependencies[i] = "*" })
    }
    if (name && obj.name !== name) obj.invalid = true
    obj.realName = name || obj.name
    obj.dependencies = obj.dependencies || {}
    if (reqver && !semver.satisfies(obj.version, reqver)) obj.invalid = true
    if (parent && !(name in parent.dependencies)) obj.extraneous = true
    if (parent) obj.parent = parent
    obj.path = folder
    asyncMap(installed, function (pkg, cb) {
      readInstalled_( path.resolve(folder, "node_modules/"+pkg)
                   , obj, pkg, obj.dependencies[pkg], cb )
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
function resolveInheritance (obj) {
  Object.keys(obj.dependencies).forEach(function (dep) {
    findUnmet(obj.dependencies[dep])
  })
  Object.keys(obj.dependencies).forEach(function (dep) {
    resolveInheritance(obj.dependencies[dep])
  })
}

// find unmet deps by walking up the tree object.
// No I/O
function findUnmet (obj) {
  //console.error("find unmet", obj.name)
  var deps = obj.dependencies
  Object.keys(deps)
    .filter(function (d) { return typeof deps[d] === "string" })
    .forEach(function (d) {
      //console.error("find unmet", obj.name, d, deps[d])
      var r = obj.parent
        , found = null
      while (r && !found) {
        //console.error("looking in "+r.name, r.dependencies)
        found = r.dependencies[d]
        if (!found) {
          r = r.parent
          continue
        }
        if (!semver.satisfies(found.version, deps[d])) {
          // the bad thing will happen!
          log.warn(obj.path + " requires "+d+"@'"+deps[d]
                  +"' but will load\n"
                  +found.path+",\nwhich is version "+found.version
                  ,"unmet dependency")
          found.invalid = true
        }
        obj.dependencies[d] = found
      }
    })
  return obj
}

if (module === require.main) {
  var util = require("util")
  console.error("testing")
  readInstalled(process.cwd(), function (er, map) {
    if (er) return console.error(er.stack || er.message)
    cleanup(map)
    console.error(util.inspect(map, true, Infinity, true))
  })
  function cleanup (map) {
    for (var i in map) switch (i) {
      case "path":
      case "extraneous": case "invalid": case "parent":
      case "dependencies": case "version":
        continue
      default: delete map[i]
    }
    var dep = map.dependencies
    delete map.dependencies
    if (dep) {
      map.dependencies = dep
      for (var i in dep) if (typeof dep[i] === "object") {
        cleanup(dep[i])
      }
    }
    return map
  }
}
