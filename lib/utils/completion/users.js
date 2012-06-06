
module.exports = users

var registry = require("../npm-registry-client/index.js")
  , containsSingleMatch = require("./contains-single-match.js")
  , getCompletions = require("./get-completions.js")
  , log = require("npmlog")

function users (args, index, cb) {
  var name = (args.length + 1 === index) ? args[args.length - 1] : ""
  if (name === undefined) name = ""
  // use up-to 1 day stale cache.  doesn't change much
  log.warn("users completion", "About to fetch")
  registry.get("/-/users", null, 24*60*60, function (er, d) {
    log.warn("userdata", d)
    log.warn("name", name)
    if (er) return cb(er)
    var remoteList = Object.keys(d)
      , simpleMatches = getCompletions(name, remoteList)
    return cb(null, simpleMatches)
  })
}
