var path = require("path")
var fs = require("fs")

var test = require("tap").test
var mkdirp = require("mkdirp")
var rimraf = require("rimraf")

var common = require("../common-tap.js")

/*
  npm install num@0.2.2 -S
  npm rm request
  npm install --registry=https://registry.nodejitsu.com num@0.2.2 -S
*/

var pkg = path.join(__dirname, "install-from-wrong-registry-cache")
var npmOpts = {
  cwd: pkg
}

test("setup", function (t) {
  mkdirp(pkg, onmkdirp)

  function onmkdirp (err) {
    t.ifError(err)

    fs.writeFile(
      path.join(pkg, "package.json"),
      JSON.stringify({
        name: "install-from-wrong-registry-cache",
        version: "2.35.0"
      }),
      function (er) {
        t.ifError(er)

        t.pass("setup done")
        t.end()
      }
    )
  }
})

test("npm install from two registries", function (t) {
  common.npm(["install", "num@0.2.2"], npmOpts, onfirstinstall)

  function onfirstinstall(er, stdout, stderr) {
    t.ifError(er)

    common.npm(["rm", "num"], npmOpts, onrm)
  }

  function onrm(er) {
    t.ifError(er)

    // common.npm(["cache", "clear", "num"], npmOpts, function (er) {
      // t.ifError(er)

    // dont know how to mock out a second registry
    var secondArchive = "https://registry.nodejitsu.com"
    var cmd = ["install", "num@0.2.2", "--registry=" + secondArchive]

    common.npm(cmd, npmOpts, onsecondinstall)
    // })
  }

  function onsecondinstall(er, code, stdout, stderr) {
    t.ifError(er, "install from second registry successfully")

    console.log("stdout", stdout)
    console.log("stderr", stderr)

    checkNumPackageRegistry(t, "https://registry.nodejitsu.com", onchecked)
  }

  function onchecked(er) {
    t.ifError(er)

    common.npm(["rm", "num"], npmOpts, onrm2)
  }

  function onrm2(er) {
    t.ifError(er)

    var thirdArchive = "http://registry.npmjs.org.au"
    var cmd = ["install", "num@0.2.2", "--registry=" + thirdArchive]

    common.npm(cmd, npmOpts, onthirdinstall)
  }

  function onthirdinstall(er, code, stdout, stderr) {
    t.ifError(er)

    console.log("stdout", stdout)
    console.log("stderr", stderr)

    checkNumPackageRegistry(t, "http://registry.npmjs.org.au", onchecked2)
  }

  function onchecked2(er) {
    t.ifError(er)

    t.end()
  }
})

function checkNumPackageRegistry(t, registry, cb) {
    var numPackage = path.join(pkg,
      "node_modules", "num", "package.json")

    fs.readFile(numPackage, "utf8", onnumpackage)

    function onnumpackage(er, buf) {
      t.ifError(er)

      var package = JSON.parse(buf)
      
      // _resolved must indicate it was installed from registry
      t.equal(package._resolved, registry + "/num/-/num-0.2.2.tgz")

      var int = path.join(pkg,
        "node_modules", "num",
        "node_modules", "int", "package.json")

      fs.readFile(int, "utf8", onintpackage)
    }

    function onintpackage(er, buf) {
      t.ifError(er)

      var package = JSON.parse(buf)

      // _resolved for NESTED node_modules must indicate that
      // it was installed from registry
      t.equal(package._resolved, registry + "/int/-/int-0.1.2.tgz")

      cb(null)
    }
}

test("cleanup", function (t) {
  rimraf(pkg, function (er) {
    t.ifError(er)

    t.end()
  })
})
