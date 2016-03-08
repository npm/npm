// npm explore <pkg>[@<version>]
// open a subshell to the package folder.

module.exports = explore
explore.usage = 'npm explore <pkg> [ -- <cmd>]'
explore.completion = require('./utils/completion/installed-shallow.js')

var npm = require('./npm.js')
var spawn = require('./utils/spawn')
var path = require('path')
var fs = require('graceful-fs')
var isWindowsShell = require('./utils/is-windows-shell.js')

function explore (args, cb) {
  if (args.length < 1 || !args[0]) return cb(explore.usage)
  var p = args.shift()
  var shellArgs = []
  if (args) {
    var execArg = args.join(' ').trim()
    if (isWindowsShell) {
      shellArgs = ['/d', '/s', '/c', execArg]
    } else {
      shellArgs = ['-c', execArg]
    }
  }

  var cwd = path.resolve(npm.dir, p)
  var sh = npm.config.get('shell')
  fs.stat(cwd, function (er, s) {
    if (er || !s.isDirectory()) {
      return cb(new Error(
        "It doesn't look like " + p + ' is installed.'
      ))
    }

    if (!shellArgs.length) {
      console.log(
        '\nExploring ' + cwd + '\n' +
          "Type 'exit' or ^D when finished\n"
      )
    }

    var shell = spawn(sh, shellArgs, { cwd: cwd, stdio: 'inherit' })
    shell.on('close', function (er) {
      // only fail if non-interactive.
      if (!shellArgs.length) return cb()
      cb(er)
    })
  })
}
