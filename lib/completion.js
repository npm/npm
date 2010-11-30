
module.exports = completion

completion.usage = "Not intended to be used directly.\n"
                 + "See the npm-completion.sh script in the npm "
                 + "source directory"

var npm = require("../npm")
  , getCompletions = require("./utils/completion/get-completions")
  , containsSingleMatch = require("./utils/completion/contains-single-match")
  , output = require("./utils/output")
  , index = + (npm.config.get("comp-cword") || process.env.COMP_CWORD)
  , log = require("./utils/log")

function completion (args, cb_) {
  var cmd = args[1] || ""
    , complFullList = getCompletions(cmd, npm.fullList, true)
  //Object.keys(process.env).filter(function (e) {
  //  return e.toUpperCase().match(/^COMP/)
  //}).forEach(function (e) {
  //  log.warn(e+"="+JSON.stringify(process.env[e]), "completion env")
  //})
  //log.warn(args, "completion args")
  //log.warn([cmd,index], "cmd")

  function cb (er, list) {
    if (er) return cb_(er)
    outputCompletions(list, cb_)
  }
  var uniqueCmd = (complFullList.indexOf(cmd) !== -1 &&
                   containsSingleMatch(cmd, complFullList))

  if (index === 1 && uniqueCmd) {
    //log.warn(cmd, "unique command")
    cb(null, [cmd])
  } else if (index > 1 || uniqueCmd) {
    var subargs = args.slice(2)
    // TODO: bundle
    npm.commands[npm.deref(cmd)].completion(subargs, index, cb)
  } else cb(null, complFullList)
}

function outputCompletions (list, cb_) {
  var outfd = npm.config.get("outfd")
  function cb () { cb_(list.length ? null : "no match found", list) }
  //log.warn(list, "completion output")
  output.write(outfd, list, false, cb)
}
