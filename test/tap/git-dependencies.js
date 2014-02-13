// 1) setup (create two packages A and B, serve A via http)
//    *) A is a git-repository with two commits
//    *) serve A via http on http://localhost:<port> (`git update-server-info`)
// 2) run `npm i` inside package B
//    *) B depends on A#master
//    *) it should fetch and update the cache
// 3) run `npm i` inside package B again
//    *) B depends on A#<first-commit>
//    *) it should not fetch (since the commit is already in the local cache)
// 4) let B depend on the second commit of A and run `npm i` again
//    *) B depends on A#<second-commit>
//    *) it should not fetch (since the commit is already in the local cache)
// 5) create a third commit in A and let B depend on it and run `npm i` again
//    *) it should fetch and update the cache

if (process.platform === "win32") {
  console.error("skipping test, because windows and bash")
  return
}

var test = require("tap").test
var fs = require("fs")
var path = require("path")
var mkdirp = require("mkdirp")
var rimraf = require("rimraf")
var http = require("http")
var url = require("url")
var exec = require("child_process").exec
var spawn = require("child_process").spawn

var port = 10000+Math.random()*10000|0
var urlA = "git+http://localhost:"+port+"/"

var pathNpm = path.resolve(__dirname, "..", "..", "bin", "npm-cli.js")
var pathTest = path.resolve(__dirname, "git-dependencies")
var pathTmp = path.resolve(pathTest, "tmp")
var pathCache = path.resolve(pathTest, "cache")
var pathA = path.resolve(pathTest, "A")
var pathB = path.resolve(pathTest, "B")
var pathAgit = path.resolve(pathA, ".git")
var pathApkg = path.resolve(pathA, "package.json")
var pathBpkg = path.resolve(pathB, "package.json")
var pathAindex = path.resolve(pathA, "index.js")
var pathBindex = path.resolve(pathB, "index.js")

var pkgA = { name: "A", version: "0.0.0" }
var pkgB = { name: "B", version: "0.0.0", dependencies: { A: urlA } }
var npmEnv = { npm_config_cache: pathCache
             , npm_config_tmp: pathTmp
             , npm_config_prefix: pathTest
             , npm_config_global: "false"
             , HOME: process.env.HOME
             , Path: process.env.PATH
             , PATH: process.env.PATH }

var gitServer, gitServerRequests = 0

test("setup", function(t) {
  rimraf.sync(pathTest)
  mkdirp.sync(pathTmp)
  mkdirp.sync(pathCache)
  mkdirp.sync(pathA)
  mkdirp.sync(pathB)
  fs.writeFileSync(pathApkg, JSON.stringify(pkgA))
  fs.writeFileSync(pathBpkg, JSON.stringify(pkgB))
  fs.writeFileSync(pathAindex, "module.exports = 1")
  fs.writeFileSync(pathBindex, "module.exports = require('A')")
  var cmd = "git init . && git add . && git commit -am'commit 1'"
          + " && echo 'module.exports = 2' > index.js"
          + " && git commit -am'commit 2'"
          + " && git update-server-info"
  exec(cmd, {cwd:pathA}, function(err, d) {
    t.notOk(err, 'setup packages')
    serveGit(pathAgit, port, function(err) {
      t.notOk(err, "serve git-repo")
      t.end()
    })
  })
})

test("install A#<first-commit>", function(t) {
  getCommits(pathA, function(err, d){
    fs.writeFileSync(pathBpkg, JSON.stringify(pkgB))
    exec(pathNpm+' i', {cwd:pathB, env:npmEnv}, function(err, d) {
      t.notOk(err, d)
      t.end()
    })
  })
})

test("install A#<first-commit> again", function(t) {
  var currRequests = gitServerRequests
  getCommits(pathA, function(err, d){
    pkgB.dependencies.A = urlA+"#"+d[d.length-1]
    fs.writeFileSync(pathBpkg, JSON.stringify(pkgB))
    exec(pathNpm+' i', {cwd:pathB, env:npmEnv}, function(err, d) {
      t.notOk(err, d)
      t.equal(currRequests, gitServerRequests, "it should not fetch")
      t.end()
    })
  })
})

test("install A#<second-commit>", function(t) {
  var currRequests = gitServerRequests
  getCommits(pathA, function(err, d) {
    pkgB.dependencies.A = urlA+"#"+d[d.length-2]
    fs.writeFileSync(pathBpkg, JSON.stringify(pkgB))
    exec(pathNpm+' i', {cwd:pathB, env:npmEnv}, function(err, d) {
      t.notOk(err, d)
      t.equal(currRequests, gitServerRequests, "it should not fetch")
      t.end()
    })
  })
})

test("make a third commit and install A#<third-commit>", function(t) {
  var currRequests = gitServerRequests
  var cmd = "echo 'module.exports = 3' > index.js"
          + " && git commit -am'commit 3'"
          + " && git update-server-info"
  exec(cmd, {cwd:pathA}, function(err, d) {
    getCommits(pathA, function(err, d) {
      pkgB.dependencies.A = urlA+"#"+d[d.length-3]
      fs.writeFileSync(pathBpkg, JSON.stringify(pkgB))
      exec(pathNpm+' i', {cwd:pathB, env:npmEnv}, function(err, d) {
        t.notOk(err, d)
        t.ok(currRequests < gitServerRequests, "it should fetch")
        t.end()
      })
    })
  })
})

test("cleanup", function(t){
  rimraf.sync(pathTest)
  gitServer.close()
  t.end()
})

function getCommits(path, cb) {
  exec("git log --pretty='%H'", {cwd:path}, function(err, d){
    if (err) return cb(err)
    cb(null, d.trim().split('\n'))
  })
}

function serveGit(path, port, cb) {
  gitServer = http.createServer(handler).listen(port, cb)
  function handler(req, res) {
    gitServerRequests++
    var p = path+url.parse(req.url).pathname
    fs.createReadStream(p).pipe(res)
  }
}

