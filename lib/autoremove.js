
module.exports = autoremove

// Search through packages removing them if they are marked
// as auto-removeable and don't have any dependents.
// Normally just triggered by an install of a newer dependency.

autoremove.usage =
  "npm autoremove [<pkg>[@<version>] [<pkg>[@<version>]] ...]"

function autoremove (args, cb) {
  return cb(new Error("Not implemented"))
}
