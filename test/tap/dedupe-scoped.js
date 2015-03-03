var test = require("tap").test
  , fs = require("fs")
  , path = require("path")
  , existsSync = fs.existsSync || path.existsSync
  , rimraf = require("rimraf")
  , mr = require("npm-registry-mock")
  , common = require("../common-tap.js")

var EXEC_OPTS = {}

test("dedupe finds the common scoped modules and moves it up one level", function (t) {
  setup(function (s) {
    common.npm(
    [
      "install", ".",
      "--registry", common.registry
    ],
    EXEC_OPTS,
    function (err, code) {
      scopePackages(function () {
        t.ifError(err, "successfully installed directory")
        t.equal(code, 0, "npm install exited with code")
        common.npm(["dedupe"], {}, function (err, code) {
          t.ifError(err, "successfully deduped against previous install")
          t.notOk(code, "npm dedupe exited with code")
          t.ok(existsSync(path.join(__dirname, "dedupe-scoped", "node_modules", "minimist")))
          t.ok(!existsSync(path.join(__dirname, "dedupe-scoped", "node_modules", "checker")))
          s.close() // shutdown mock registry.
          t.end()
        })
      })
    })
  })
})

function setup (cb) {
  process.chdir(path.join(__dirname, "dedupe-scoped"))
  mr({port : common.port}, function (er, s) { // create mock registry.
    rimraf.sync(path.join(__dirname, "dedupe-scoped", "node_modules"))
    fs.mkdirSync(path.join(__dirname, "dedupe-scoped", "node_modules"))
    cb(s)
  })
}

function scopePackages (cb) {
  scopeAt("minimist", path.join(__dirname, "dedupe-scoped", "node_modules", "optimist"));
  scopeAt("minimist", path.join(__dirname, "dedupe-scoped", "node_modules", "clean"));
  cb();
}

function scopeAt(pkgName, targetPath) {
  var pkg, p, p2;

  p = path.join(targetPath, "package.json")
  pkg = JSON.parse(fs.readFileSync(p).toString())
  pkg.dependencies["@scoped/" + pkgName] = pkg.dependencies[pkgName]
  delete pkg.dependencies[pkgName]
  fs.writeFileSync(p, JSON.stringify(pkg, null, 2))

  p = path.join(targetPath, "node_modules", pkgName, "package.json")
  pkg = JSON.parse(fs.readFileSync(p).toString())
  pkg.name = "@scoped/" + pkgName
  fs.writeFileSync(p, JSON.stringify(pkg, null, 2))

  p = path.join(targetPath, "node_modules", "@scoped")
  fs.mkdirSync(p)

  p = path.join(targetPath, "node_modules", pkgName)
  p2 = path.join(targetPath, "node_modules", "@scoped", pkgName)
  fs.renameSync(p, p2)
}