var fs = require("fs")
var path = require("path")
var test = require("tap").test
var osenv = require("osenv")
var chain = require("slide").chain
var rimraf = require("rimraf")
var mkdirp = require("mkdirp")
var common = require("../common-tap.js")

var npm = require("../../lib/npm.js")

var pkg = path.resolve(__dirname, "add-remote-git")
var pkgChild = path.resolve(pkg, "child")

var pjParent = JSON.stringify({
  name:"parent",
  version: "1.2.3",
  dependencies: {
    "child": "git://localhost:1234/child.git"
  }
}, null, 2) + "\n"

var pjChild = JSON.stringify({
  name:"child",
  version: "1.0.3",
}, null, 2) + "\n"


test("setup", function (t) {
  cleanup()
  t.end()
})

function setup (git, cb)
{
  mkdirp.sync(pkg)
  fs.writeFileSync(path.resolve(pkg, "package.json"), pjParent)
  mkdirp.sync(pkgChild)
  fs.writeFileSync(path.resolve(pkgChild, "package.json"), pjChild)

//  git.whichAndExec(["init"], {cwd: pkgChild, env: process.env},
//                   function (er, stdout, stderr) {
//                       console.error(stdout + stderr)
//                       cb()
//                   })
  chain
    ( [ git.chainableExec([ "init" ], {cwd: pkgChild, env: process.env})
      , git.chainableExec([ "add", "package.json" ], {cwd: pkgChild, env: process.env})
      , git.chainableExec([ "commit", "-m", "stub package" ], {cwd: pkgChild, env: process.env}),
      , git.chainableExec([ "clone", "--bare", "child", "child.git" ], {cwd: pkg, env: process.env}) ]
      , cb )
}

test("install from repo", function (t) {
  npm.load({loglevel: "warn"}, function () {
    var git = require("../../lib/utils/git")

    setup(git, function () {

      process.chdir(pkg)

      fs.writeFileSync(path.resolve(pkgChild, "git-daemon-export-ok"), "")

      // start git server
      var d = git.spawn(["daemon", "--listen=localhost", "--export-all",
                         "--base-path=.", "--port=1234", "--verbose"]
                        , {cwd: pkg, stdio: ['pipe', 'pipe', 'pipe'] })

        setTimeout(function () {

        npm.install(".", function (er) {
          t.notOk(er, "Expected npm install to succeed")

          // kill git server
          d.kill('SIGINT')
          t.end()
        })
        }, 400)
    })
  })
})

function cleanup () {
  process.chdir(osenv.tmpdir())
  rimraf.sync(pkg)
}

test("clean", function (t) {
  cleanup()
  t.end()
})
