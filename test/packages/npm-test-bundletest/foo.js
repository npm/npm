var assert = require("assert")
  , path = require("path")
  , pkgdir = path.join(__dirname, "node_modules")
  , fs = require("fs")
  , json = fs.readFileSync(path.join(__dirname, "package.json"),"utf8")
  , pkg = JSON.parse(json)
  , deps = Object.keys(pkg.dependencies)

deps.forEach(function (dep) {
  var d = require.resolve(dep)
  assert.equal(0, d.indexOf(pkgdir)
              ,dep+" not in "+pkgdir+"\nFound at "+d)
})
