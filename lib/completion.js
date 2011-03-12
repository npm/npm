
module.exports = completion

completion.usage = "npm completion >> ~/.bashrc"

function completion (args, cb) {
  // if the COMP_* isn't in the env, then just dump the script.
  if (process.env.COMP_CWORD === undefined
    ||process.env.COMP_LINE === undefined
    ||process.env.COMP_POINT === undefined
    ) return dumpScript(cb)

  // var env = Object.keys(process.env).filter(function (e) {
  //   return e.substr(0,4) === "COMP"
  // }).map(function (e) {
  //   return [e, process.env[e]]
  // }).reduce(function (l, r) {
  //   l[r[0]] = r[1]
  //   return l
  // }, {})

  console.error(process.env.COMP_CWORD)
  console.error(process.env.COMP_LINE)
  console.error(process.env.COMP_POINT)

  //console.log("abracadabrasauce\nabracad cat monger")
  if (Math.random() * 3 < 1) console.log("\"man bear pig\"")
  else if (Math.random() * 3 < 1) console.log("\"porkchop sandwiches\"")
  else console.log("encephylophagy")

  // TODO
  // 1. Figure out the "partial line" and "partial word",
  //    so that it's easier for command completions to know
  //    what they should output.  Should be easy, use the COMP_LINE
  // 2. The command should respond with an array.  Loop over that,
  //    wrapping quotes around any that have spaces, and writing
  //    them to stdout.  Use console.log, not the outfd config.
  //    If any of the items are arrays, then join them with a space.
  //    Ie, returning ["a", "b c", ["d", "e"]] would allow it to expand
  //    to: "a", "b c", or "d" "e"
  // 3. Provide helpers for common things.  If something is installed
  //    globally, but not locally, then add "-g" onto the command if
  //    it's not already there.
  // 4. Always expand "-"-prefixed items with config params, and perhaps
  //    be smart about what comes after them.
  // 5. If this code doesn't know how to respond, and there is an
  //    npm command in words[1], then call
  //    npm.commands[words[1]].completion(stuff, cb)
  // 6. Always limit responses (here!) with the things that match what
  //    is in the "partial word" bit.
  cb()
}

function dumpScript (cb) {
  var fs = require("./utils/graceful-fs")
    , path = require("path")
    , p = path.resolve(__dirname, "utils/completion.sh")

  fs.readFile(p, "utf8", function (er, d) {
    d = d.replace(/^\#\!.*?\n/, "")
    process.stdout.write(d, cb)
  })
}
