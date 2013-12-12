var test = require("tap").test
var rimraf = require("rimraf")

var mr = require("npm-registry-mock")

var spawn = require("child_process").spawn
var npm = require.resolve("../../bin/npm-cli.js")
var node = process.execPath
var pkg = "./url-dependencies"

var mockRoutes = {
  "get": {
    "/underscore/-/underscore-1.3.1.tgz": [200]
  }
}

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

function tarballWasFetched(output){
  return output.indexOf("http GET http://localhost:1337/underscore/-/underscore-1.3.1.tgz") > -1
}

function performInstall (cb) {
  mr({port: 1337, mocks: mockRoutes}, function(s){
    var output = ""
      , child = spawn(node, [npm, "install"], {
          cwd: pkg,
          env: {
            npm_config_registry: "http://localhost:1337",
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
      s.close()
      cb(output)
    })
  })
}
