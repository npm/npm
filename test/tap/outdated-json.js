var common = require("../common-tap.js")
  , test = require("tap").test
  , rimraf = require("rimraf")
  , npm = require("../../")
  , mr = require("npm-registry-mock")
  , spawn = require('child_process').spawn
  , node = process.execPath
  , npmc = require.resolve('../../')
  , pkg = __dirname + '/outdated-new-versions'
  , args = [ npmc
           , 'outdated'
           , '--json'
           , '--silent'
           , '--registry=' + common.registry
           , '--cache=' + pkg + '/cache'
           ]

var expected = { underscore:
                 { current: '1.3.3'
                 , wanted: '1.3.3'
                 , latest: '1.5.1'
                 , location: 'node_modules/underscore'
                 }
               , request:
                 { current: '0.9.5'
                 , wanted: '0.9.5'
                 , latest: '2.27.0'
                 , location: 'node_modules/request'
                 }
               }

test("it should log json data", function (t) {
  cleanup()
  process.chdir(pkg)

  mr(common.port, function (s) {
    npm.load({
      cache: pkg + "/cache",
      loglevel: 'silent',
      registry: common.registry }
    , function () {
      npm.install(".", function (err) {
        var child = spawn(node, args)
          , out = ''
        child.stdout
          .on('data', function (buf) {
            out += buf.toString()
          })
          .pipe(process.stdout)
        child.on('exit', function () {
          out = JSON.parse(out)
          t.deepEqual(out, expected)
          s.close()
          t.end()
        })
      })
    })
  })
})

test("cleanup", function (t) {
  cleanup()
  t.end()
})

function cleanup () {
  rimraf.sync(pkg + "/node_modules")
  rimraf.sync(pkg + "/cache")
}