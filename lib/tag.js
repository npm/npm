
// npm tag <project> <version> <tag>

// turns out tagging isn't very complicated
// all the smarts are in the couch.
module.exports = function (args, conf, cb) {
  require("./utils/registry").tag(args.shift(), args.shift(), args.shift(), cb)
}
