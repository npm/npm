/*
for each pkg in prefix that isn't a git repo
  look for a new version of pkg that satisfies dep
  if so, install it.
  if not, then update it
*/

module.exports = update

update.usage = "npm update [pkg]"

var npm = require("./npm.js")
  , asyncMap = require("slide").asyncMap
  , log = require("npmlog")
  , fs = require("fs")
  , path = require("path")

  // load these, just so that we know that they'll be available, in case
  // npm itself is getting overwritten.
  , install = require("./install.js")
  , build = require("./build.js")

update.completion = npm.commands.outdated.completion

function update (args, cb) {
  npm.commands.outdated(args, true, function (er, outdated) {
    log.info("outdated", "updating", outdated)
    if (er) return cb(er)

    // check for existence of shrinkwrap file
    var shrinkwrapFile = path.resolve(npm.dir, "..", "npm-shrinkwrap.json")
    log.info("update", "validity-check",
             "checking for shrinkwrap file " + shrinkwrapFile)

    if (npm.config.get("shrinkwrap") === true &&
        fs.existsSync(shrinkwrapFile)) {
        log.error("update", "blocked-by-shrinkwrap",
                  "Cannot update: `" + shrinkwrapFile + "` exists")

        return cb(null);
    }

    asyncMap(outdated, function (ww, cb) {
      // [[ dir, dep, has, want, req ]]
      var where = ww[0]
        , dep = ww[1]
        , want = ww[3]
        , what = dep + "@" + want
        , req = ww[5]
        , url = require('url')

      // use the initial installation method (repo, tar, git) for updating
      if (url.parse(req).protocol) what = req
      npm.commands.install(where, what, cb)
    }, cb)
  })
}
