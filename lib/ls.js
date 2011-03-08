
// show the installed versions of packages
//
// --parseable creates output like this:
// <full path>:<name@version>:EXTRANEOUS:INVALID:MISSING
// where the last three flags are indicators of problems,
// or at least oddness.

module.exports = exports = ls

var npm = require("../npm")
  , readInstalled = require("./utils/read-installed")
  , output = require("./utils/output")
  , log = require("./utils/log")
  , relativize = require("./utils/relativize")
  , path = require("path")

ls.usage = "npm ls"

ls.completion = function (args, index, cb) {
  cb(new Error("not yet implemented"))
}


function ls (args, cb) {
  var dir = npm.config.get("prefix")
  readInstalled(dir, function (er, data) {
    if (er) return cb(er)
    var long = npm.config.get("long")
             && !npm.config.get("parseable")
    output.write(npm.config.get("outfd")
                ,makePretty(data, long, dir).join("\n")
                ,cb)
  })
}

function makePretty (data, long, dir, prefix, list) {
  list = list || []
  prefix = prefix || ""
  list.push(format(data, long, prefix, dir))
  var deps = data.dependencies || {}
    , childPref = prefix.split("├─").join("│ ")
                        .split("└─").join("  ")
    , depList = Object.keys(deps)
    , depLast = depList.length - 1
  Object.keys(deps).forEach(function (d, i) {
    var depData = deps[d]
    if (typeof depData === "string") {
      log.warn("Unmet dependency in "+data.path, d+" "+deps[d])
      depData = npm.config.get("parseable")
              ? path.resolve(data.path, "node_modules", d)
                +":"+d+"@"+JSON.stringify(depData)+"::INVALID:MISSING"
              : " \033[31;40mUNMET DEPENDENCY\033[0m "+d+" "+depData
    } else if (depData.path.indexOf(dir) === 0
               && depData.path.indexOf(data.path) !== 0) {
      depData = Object.create(depData)
      depData.dependencies = {}
    }
    var c = i === depLast ? "└─" : "├─"
    makePretty(depData, long, dir, childPref + c, list)
  })
  return list
}

function ugly (data) {
  if (typeof data === "string") {
    return data
  }
  return data.path + ":"
       + (data._id || "") + ":"
       + (data.extraneous ? "EXTRANEOUS" : "") + ":"
       + (data.invalid ? "INVALID" : "") + ":"
}

function format (data, long, prefix, dir) {
  if (npm.config.get("parseable")) return ugly(data)
  if (typeof data === "string") {
    return prefix + data
  }
//  console.log([data.path, dir], "relativize")
  var depLen = Object.keys(data.dependencies || {}).length
    , space = prefix.split("├─").join("│ ")
                    .split("└─").join("  ")
            + (depLen ? "" : " ")
    , rel = relativize(data.path, dir)
    , l = prefix
        + (rel === "." ? "" : depLen ? "┬ " : "─ ")
        + (data._id ? data._id + " " : "")
        + (rel === "." && !(long && data._id) ? dir : "")
  if (data.invalid) {
    if (data.realName !== data.name) l += "("+data.realName+") "
    l += "\033[31;40minvalid\033[0m "
  }
  if (data.extraneous && rel !== ".") {
    l += "\033[32;40mextraneous\033[0m "
  }
  if (!long || !data._id) return l
  var extras = []
  if (rel !== ".") extras.push(rel)
  else extras.push(dir)
  if (data.description) extras.push(data.description)
  if (data.repository) extras.push(data.repository.url)
  if (data.homepage) extras.push(data.homepage)
  extras = extras.filter(function (e) { return e })
  var lastExtra = !depLen && extras.length - 1
  l += extras.map(function (e, i) {
    var indent = !depLen ? " " : "│ "
    return "\n" + space + indent + e
  }).join("")
  return l
}
