var fs = require('graceful-fs')
var path = require('path')
var spawn = require('child_process').spawn

var mkdirp = require('mkdirp')
var osenv = require('osenv')
var rimraf = require('rimraf')
var test = require('tap').test

var node = process.execPath
var npm = require.resolve('../../bin/npm-cli.js')

var pkg = path.resolve(__dirname, 'lifecycle-order')

var json = {
  name: 'lifecycle-order',
  version: '1.0.0',
  scripts: {
    preinstall: 'node -e "var fs = require(\'fs\'); fs.openSync(\'preinstall-step\', \'w+\'); if (fs.existsSync(\'node_modules\')) { throw \'node_modules exists on preinstall\' }"',
    install: 'node -e "var fs = require(\'fs\'); if (fs.existsSync(\'preinstall-step\')) { fs.openSync(\'install-step\', \'w+\') } else { throw \'Out of order\' }"',
    postinstall: 'node -e "var fs = require(\'fs\'); if (fs.existsSync(\'install-step\')) { fs.openSync(\'postinstall-step\', \'w+\') } else { throw \'Out of order\' }"'
  }
}

test('setup', function (t) {
  cleanup()
  mkdirp.sync(pkg)
  fs.writeFileSync(
    path.join(pkg, 'package.json'),
    JSON.stringify(json, null, 2)
  )

  process.chdir(pkg)
  t.end()
})

test('lifecycle scripts execute in the proper order', function (t) {
  var child = spawn(node, [npm, 'install'], {
    cwd: pkg
  })

  // Ensure files exist for lifecycle runs
  // If code is 1 and/or all three files do not exist
  // Then lifecycle scripts are not executed in proper order
  child.on('close', function (code, signal) {
    t.equal(code, 0)

    // All three files should exist
    t.equal(fs.existsSync(path.join(pkg, 'preinstall-step')), true)
    t.equal(fs.existsSync(path.join(pkg, 'install-step')), true)
    t.equal(fs.existsSync(path.join(pkg, 'postinstall-step')), true)

    t.end()
  })
})

test('cleanup', function (t) {
  cleanup()
  t.end()
})

function cleanup () {
  process.chdir(osenv.tmpdir())
  rimraf.sync(pkg)
}
