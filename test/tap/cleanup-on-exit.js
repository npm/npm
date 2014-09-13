if (process.argv[2] === undefined) {
  // parent

  var test = require('tap').test
    , path = require('path')
    , fs = require('fs')
    , spawn = require('child_process').spawn
    , node = process.execPath

  test('clean lock files on exit', function (t) {
    if (process.versions.node < '0.11') return t.end()

    var lockFile = path.join(__dirname, Math.random() + '.lock')
    var child = spawn(node, [ __filename, lockFile ], { stdio: 'pipe' })
    var stdout = ''
    child.stdout.on('data', function(d) {
      stdout += d
    })
    child.on('exit', function(code) {
      t.ok(!fs.existsSync(lockFile))
      t.equal(code, 1)
      t.equal(stdout, 'loaded\n')
      t.end()
    })
  })

} else {
  // child

  var npm = require('../../')
    , path = require('path')
    , errorHandler = require('../../lib/utils/error-handler')

  npm.load({}, function () {
    var f = process.argv[2]
    require('lockfile').lock(f, function(err) {
      if (err) console.log(err)
      console.log('loaded')
      errorHandler(new Error('foo'))
      process.exit()
    })
  })
}

