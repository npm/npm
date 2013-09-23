var test = require("tap").test
var rimraf = require("rimraf")

var spawn = require("child_process").spawn
var npm = require.resolve("../../bin/npm-cli.js")
var node = process.execPath
var pkg = "./url-dependencies"

test("url-dependencies: download first time", function(t) {
  rimraf.sync(__dirname + "/url-dependencies/node_modules")

  performInstall(function(output){
    if(!tarballWasFetched(output)){
      t.fail("Tarball was not fetched")
    }else{
      t.pass("Tarball was fetched")
    }
    t.end()
  })
})

test("url-dependencies: do not download subsequent times", function(t) {
  rimraf.sync(__dirname + "/url-dependencies/node_modules")

  performInstall(function(){
    performInstall(function(output){
      if(tarballWasFetched(output)){
        t.fail("Tarball was fetched second time around")
      }else{
        t.pass("Tarball was not fetched")
      }
      t.end()
    })
  })
})

test("url-dependencies: still downloads multiple times when using --force", function(t) {
  rimraf.sync(__dirname + "/url-dependencies/node_modules")

  performInstall(function(){
    performInstall(true, function(output){
      if(tarballWasFetched(output)){
        t.pass("Tarball was fetched when using --force")
      }else{
        t.fail("Tarball was not fetched when using --force")
      }
      t.end()
    })
  })
})

function tarballWasFetched(output){
  return output.indexOf("http GET https://registry.npmjs.org/once/-/once-1.2.0.tgz") > -1
}

function performInstall (force, cb) {
  if(typeof force === "function") cb = force, force = false
  var output = ""
    , child = spawn(node, [npm, "install", force ? "--force" : ""], {
        cwd: pkg,
        env: {
          // npm_config_registry: "http://localhost:1337",
          npm_config_cache_lock_stale: 1000,
          npm_config_cache_lock_wait: 1000,
          HOME: process.env.HOME,
          Path: process.env.PATH,
          PATH: process.env.PATH
        }
      })

  child.stderr.on("data", function(data){
    output += data.toString()
  })
  child.on("close", function () {
    // process.exit()
    cb(output)
  })
}
