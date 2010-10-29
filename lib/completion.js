
module.exports = completion

completion.usage = "Not intended to be used directly.\n"
                 + "See the npm-completion.sh script in the npm source directory"

var npm = require("../npm")
  , output = require("./utils/output")

function completion (args, cb_) {
  var index = npm.config.get("comp-cword") || process.env.COMP_CWORD || args.length - 1
    , c = args[index] || ""
    , p = args[index - 1]
    , outfd = npm.config.get("outfd")
    , m = []

  // TODO: Need to have command-specific functions or something for completion.
  // so, if you do "npm install <TAB>", then it should show a list of the package
  // names in the registry, and "npm install foo<TAB>" should show all the install
  // targets for foo.
  // Especially, stuff like "npm config" that have sub-commands should get
  // completion love.

  npm.fullList.forEach(function (f) {
    // console.error(f)
    var a = npm.deref(f)
    if (m.indexOf(a) === -1 && f.indexOf(c) === 0) m.push(a)
  })
  function cb () { cb_(m.length ? null : "no match for "+JSON.stringify(c), m) }
  output.write(outfd, m, false, cb)
}

