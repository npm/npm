var existsSync = require("fs").existsSync
var join = require("path").join

var test = require("tap").test
var rimraf = require("rimraf")
var mkdirp = require("mkdirp")

var npm = require("../../")

var pkg = join(__dirname, "install-from-local", "package-with-scoped-paths")
var modules = join(pkg, "node_modules")

test("setup", function (t) {
  rimraf.sync(modules)
  rimraf.sync(join(pkg, "cache"))
  process.chdir(pkg)
  mkdirp.sync(modules)
  t.end()
})

test("installing already installed local scoped package", function (t) {
  npm.load({loglevel: "silent"}, function() {
    npm.commands.install(function (err, arr, installed) {
      t.ifError(err, "install ran to completion without error")
      t.ok(
        existsSync(join(modules, "@scoped", "package", "package.json")),
        "package installed"
      )
      t.ok(installed["node_modules/@scoped/package"], "installed @scoped/package")
      t.ok(installed["node_modules/package-local-dependency"], "installed package-local-dependency")

      npm.commands.install(function (err, arr, installed) {

        t.ifError(err, "install ran to completion without error")

        t.ok(
          existsSync(join(modules, "@scoped", "package", "package.json")),
          "package installed"
        )

        t.notOk(installed["node_modules/@scoped/package"], "did not reinstall @scoped/package")
        t.notOk(installed["node_modules/package-local-dependency"], "did not reinstall package-local-dependency")
        t.end()
      })
    })
  })
})

test("cleanup", function(t) {
  process.chdir(__dirname)
  rimraf.sync(join(modules))
  rimraf.sync(join(pkg, "cache"))
  t.end()
})
