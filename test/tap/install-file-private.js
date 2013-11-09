// this test needs git installed

var test = require("tap").test
var npm = require("../../")
var osenv = require("osenv")
var path = require("path")
var fs = require("fs")
var rimraf = require("rimraf")
var mkdirp = require("mkdirp")
var path = require("path")

var spawn = require("child_process").spawn
var node = process.execPath

var pkg = process.env.npm_config_tmp || osenv.tmpdir()
pkg += path.sep + "install-file-private"

var gitPkg = "npm-test-git"
var gitPath = osenv.tmpdir() + path.sep + gitPkg

test("it installs local gitrepos", function (t) {
  writePackageJson()
  prepareGitRepo(cb)

  process.chdir(pkg)

  function cb () {
    npm.load({cache: pkg + "/cache"}, function () {
      npm.install(".", function (err) {
        var md = pkg + "/node_modules/git-file/README.md"
        var content = fs.readFileSync(md, "utf8")
        t.equal("just a test with git", content)
        t.end()
      })
    })
  }
})

test("cleanup", function (t) {
  // windows fix for locked files
  process.chdir(osenv.tmpdir())

  rimraf.sync(pkg)
  rimraf.sync(gitPath)
  t.end()
})

// this package.json will require the git repo
function writePackageJson () {
  rimraf.sync(pkg)
  mkdirp.sync(pkg)
  mkdirp.sync(pkg + "/cache")

  fs.writeFileSync(pkg + "/package.json", JSON.stringify({
    "author": "Rocko Artischocko",
    "private": true,
    "name": "git-file",
    "version": "0.0.0",
    "dependencies": {
      "testpackage": "git+file://" + gitPath
    }
  }), 'utf8')
}

// prepare git repo
function prepareGitRepo (cb) {
  rimraf.sync(gitPath)
  mkdirp.sync(gitPath)
  var opts = { cwd: gitPath }
  fs.writeFileSync(gitPath + "/package.json", JSON.stringify({
    "author": "Rocko Artischocko",
    "private": true,
    "name": "git-file",
    "version": "0.0.0",
    "description": "fixture"
  }), 'utf8')

  fs.writeFileSync(gitPath + "/README.md"
    , "just a test with git", 'utf8')

  var childInit = spawn("git", ["init"], opts)
  var childAdd, childCommit
  childInit.on("close", function () {
    childAdd = spawn("git", ["add", "."], opts)
    childAdd.on("close", function () {
      childCommit = spawn("git"
        , ["commit", "-n", "-m", "test"], opts)
      childCommit.on("close", function () {
        cb()
      })
    })
  })
}
