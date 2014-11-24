// support both link styles on both
// win32 and *nix
var path = require("path")
var test = require("tap").test
var osenv = require("osenv")
var rimraf = require("rimraf")
var mkdirp = require("mkdirp")
var fs = require("graceful-fs")
var common = require("../common-tap.js")

var npm = require("../../lib/npm.js")
var linkGetTypes = require("../../lib/utils/link").getTypes

var pkg = path.resolve(__dirname, "bin-link-type")

test("setup", function (t) {
  cleanup()
  t.end()
})

test("install with unix", function (t) {
  setup()
  common.npm(["install", "--prefix=" + pkg, "./pack"]
           , { cwd: pkg
               , env: { npm_config_bin_link_type: "unix" } },
             function () {
               // windows is weird with symlinks, so just skip this
               if(process.platform !== 'win32') {
                t.ok(fs.existsSync("./node_modules/.bin/pack"), "expected unix-style link")  
               }
               
               var st = fs.lstatSync("./node_modules/.bin/pack")
               t.equal(st.isSymbolicLink(), true, "expected symbolic link")

               t.ok(!fs.existsSync("./node_modules/.bin/pack.cmd"), "expected NO win-style shim")
               t.end()
  })
})

test("install with win", function (t) {
  setup()
  common.npm(["install", "--prefix=" + pkg, "./pack"]
           , { cwd: pkg
             , env: { npm_config_bin_link_type: "win" } },
             function () {
               t.ok(fs.existsSync("./node_modules/.bin/pack.cmd"), "expected win-style shim")
               t.ok(fs.existsSync("./node_modules/.bin/pack"), "expected win bash forwarding script")

               var st = fs.lstatSync("./node_modules/.bin/pack")
               t.equal(st.isSymbolicLink(), false, "expected file")
               t.end()
  })
})

test("install with both", function (t) {
  setup()
  common.npm(["install", "--prefix=" + pkg, "./pack"]
           , { cwd: pkg
           , env: { npm_config_bin_link_type: "both" } },
             function () {
               t.ok(fs.existsSync("./node_modules/.bin/pack.cmd"), "expected win-style shim")
               if(process.platform !== 'win32') {
                 t.ok(fs.existsSync("./node_modules/.bin/pack"), "expected unix-style link")
               }

               var st = fs.lstatSync("./node_modules/.bin/pack")
               t.equal(st.isSymbolicLink(), true, "expected symbolic link")
               t.end()
  })
})

test("detect link type", function ( t ) { 
  setup()
    
  t.deepEqual(linkGetTypes('win32', 'both'), { link: true, shim: true }, "expected both link and shim")
  t.deepEqual(linkGetTypes('linux', 'both'), { link: true, shim: true }, "expected both link and shim")
  t.deepEqual(linkGetTypes('win32', 'auto'), { link: false, shim: true }, "expected only shim")
  t.deepEqual(linkGetTypes('linux', 'auto'), { link: true, shim: false }, "expected only link")
  t.deepEqual(linkGetTypes('win32', 'unix'), { link: true, shim: false }, "expected only link")
  t.deepEqual(linkGetTypes('linux', 'win'), { link: false, shim: true }, "expected only shim")
  
  t.end()
    
})


function cleanup() {
  process.chdir(osenv.tmpdir())
  rimraf.sync(pkg)
}

function setup() {
  cleanup()
  process.chdir(osenv.tmpdir())
  mkdirp.sync(pkg)
  process.chdir(pkg)

  // make a mock with links
  mkdirp.sync("pack")
  fs.writeFileSync(path.resolve("pack", "package.json")
                  , JSON.stringify({name: "pack"
                                    , version: "1.0.0"
                                    , bin: "index.js"
                                    }))
  fs.writeFileSync(path.resolve("pack", "./index.js")
                 , "console.log('output')")
  
}

test("clean", function (t) {
  cleanup()
  t.end()
})
