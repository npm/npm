module.exports = test

var lifecycle = require("./utils/lifecycle")
  , cmd = lifecycle.cmd("test")
  , path = require("path")
  , readJson = require("./utils/read-json")
  , chain = require("./utils/chain")

test.usage = cmd.usage

function test (args, cb) {
  if (!args.length) {
    readJson(path.join(process.cwd(), "package.json"), function (er, d) {
      if (er) return cb(test.usage)
      chain(["pretest", "test", "posttest"].map(function (s) {
        return [lifecycle, d, s, process.cwd()]
      }).concat(cb))
    })
  }
  else cmd(args, cb)
}
