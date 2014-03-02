var test = require("tap").test
  , cacheGit = require("../")
  , noop = function () {}
  , path = require("path")
  , rimraf = require("rimraf")
  , mkdirp = require("mkdirp")
  , osenv = require("osenv")
  , crypto = require("crypto")
  , fs = require("fs")
  , log = { verbose: noop
          , silly: noop
          , error: noop }
  , zlib = require("zlib")
  , spawn = require("child_process").spawn
  , tar = require("tar")


var gitPath = path.join(osenv.tmpdir(), "test-npm-cache-git")
  , out = path.join(__dirname, "out")
  , testPath = path.join(out, "test")

test("creates tarballs from git repos", function (t) {
  rimraf.sync(gitPath)
  rimraf.sync(out)
  mkdirp.sync(out)

  prepareGitRepo(function () {
    var u = "file://" + gitPath
    // figure out what we should check out.
    var v = crypto.createHash("sha1")
      .update(u)
      .digest("hex").slice(0, 8)

    v = u.replace(/[^a-zA-Z0-9]+/g, '-') + '-' + v

    var opts = { git: "git"
          , tmp: out
          , ca: out
          , p: path.join(out, "_git-remotes", v)
          , u: u
          , co: "master"
          , origUrl: u
          , silent: false
        }

    cacheGit.checkGitDir(opts, log, noop, cacheGit.cloneGitRemote
      , cacheGit.archiveGitRemote, function (er, tarball) {
      t.ok(fs.existsSync(tarball))

      fs.createReadStream(tarball)
        .pipe(zlib.createGunzip())
        .pipe(tar.Extract({ path: testPath }))
        .on("close", function () {
          t.ok(fs.existsSync(path.join(testPath, "package", "package.json")))
          var content = fs.readFileSync(path.join(testPath, "package", "README.md"))
          t.equals(content.toString(), "just a test with git")
          t.end()
        })
    })
  })
})

test("cleanup", function (t) {
  // windows fix for locked files
  process.chdir(osenv.tmpdir())

  rimraf.sync(gitPath)
  rimraf.sync(out)
  t.end()
})

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
    , childAdd, childCommit
  childInit.on("close", function () {
    if (process.env.CI)
      setGitUser()
    else
      next()
  })
  function next () {
    childAdd = spawn("git", ["add", "."], opts)
    childAdd.on("close", function () {
      childCommit = spawn("git"
        , ["commit", "-n", "-m", "test"], opts)
      childCommit.on("close", function () {
        cb()
      })
    })
  }

  function setGitUser () {
    var c = spawn("git", ['config', 'user.email'
      , '"you@example.com"'], opts)
    c.on("close", function (er) {
      if (er) throw er
      var c = spawn("git", ['config', 'user.name'
        , '"Your name"'], opts)
      c.on("close", function (er) {
        if (er) throw er
        next()
      })
    })
  }
}
