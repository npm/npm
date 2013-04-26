module.exports = exec

var child_process = require("child_process")
  , fs = require("fs")
  , path = require("path")
  , npm = require("./npm.js")

exec.usage = "npm exec <executable>"
           + "\nnpm exec <executable> -- <executable_arguments>"

function exec(args, cb) {
  if (!args.length) return cb(exec.usage);

  var executable_dir = npm.bin
    , executable = path.basename(args[0])
    , fullpath = path.join(executable_dir, executable)
    , executable_args = args.slice(1)
    , child

  fs.exists(fullpath, function(exists) {
    if (exists) {
      child = child_process.spawn(fullpath, executable_args, { stdio: [0,1,2] })

      child.on('error', function(error) {
        cb(error)
      })

      child.on('exit', function() {
        cb(null)
      })
    } else {
      cb("Unable to find: " + executable + " in " + executable_dir)
    }
  })
}
