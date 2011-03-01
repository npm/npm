
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

module.exports = readInstalled

function readInstalled (folder, parent, name, reqver, cb) {
  if (typeof cb !== "function") cb = reqver, reqver = null
  if (typeof cb !== "function") cb = name, name = null
  if (typeof cb !== "function") cb = parent, parent = null

  var installed
    , obj

  fs.readdir(path.resolve(folder, "node_modules"), function (er, i) {
    if (er) return cb(er)
    installed = i.filter(function (f) { return f.charAt(0) !== "." })
    next()
  })

  readJson(path.resolve(folder, "package.json"), function (er, obj) {
    if (er) {
      if (parent) return cb(er)
      obj = true
    }
    return next()
  })

  function next () {
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
      readInstalled( path.resolve(folder, "node_modules/"+pkg)
                   , obj, pkg, obj.dependencies[pkg], cb )
    }, function (er, installedData) {
      if (er) return cb(er)
      installedData.forEach(function (dep) {
        obj[dep.realName] = dep
      })
      findUnmet(obj, installed)
      return cb(null, obj)
    })
  }
}

// find unmet deps by walking up the tree object.
// No I/O
function findUnmet (obj, installed) {
  var deps = obj.dependencies
  Object.keys(deps)
    .filter(function (d) { return installed.indexOf(d) === -1 })
    .filter(function (d) { return typeof deps[d] === "string" })
    .forEach(function (d) {
      var r = obj.parent
      while (r) {
        var found = r.dependencies[d]
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
