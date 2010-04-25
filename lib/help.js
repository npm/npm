
var npm = require("../npm")
  , sys = require("sys")

module.exports = help
help.printer = sys.puts

function help (args, conf, cb) {
  var command = args.shift()
  if (!(command in npm.commands)) {
    help.usage(help.printer)
  }
  if ("help" in npm.commands[command]) npm.commands[command].help(help.printer)
  else sys.puts(
    "No help provided for "+command+".  Maybe try 'man npm'")
  cb()
}

help.help = function (p) {
  p("npm help <command>")
  p("Learn more about <command>")
  p("Available commands: ")
  Object.keys(npm.commands).forEach(function (c) {
    p("  "+c)
  })
}

help.usage = function (p) {
  p("")
  p("Usage: ")
  p("  " + path.basename(process.argv[1])
    + " [global options] <command> [command options]")
  p("")
  p("<command>          Method to call on the npm object.")
  p("                   Supported: "+Object.keys(npm.commands))
  p("[command options]  The arguments to pass to the function.");
}
