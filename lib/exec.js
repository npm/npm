module.exports = exec

var child_process = require("child_process")
  , fs = require("fs")
  , path = require("path")

exec.usage = "npm exec <executable>"
           + "\nnpm exec <executable> -- <executable_arguments>"

function exec(args, cb) {
  if (!args.length) return cb(exec.usage);
  var cwd = process.cwd()
    , executable_dir = cwd + "/node_modules/.bin/"
    , executable = path.basename(args[0])
    , fullpath = executable_dir + executable
    , executable_args = args.slice(1)
    , child

  if (!fs.existsSync(fullpath)) return cb("Unable to find: " + fullpath);

  child = child_process.spawn(fullpath, executable_args, { cwd: cwd, env: process.env, stdio: [0,1,2] })

  child.on('error', function(error) {
    cb(error)
  })

  child.on('exit', function() {
    cb(null)
  })
}
