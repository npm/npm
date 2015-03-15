
module.exports = report

report.usage = "npm report [--title]"

var fs = require("fs")
var path = require("path")
var opener = require("opener")
var npm = require("./npm.js")
var endpoint = "https://github.com/npm/support-cli/issues/new"
var npmDebugLog = path.join(process.cwd(), "npm-debug.log")

function report (args, cb) {
  var title = args.length ? args[0] : npm.config.get("title")
  var body = ""
  var exist = fs.existsSync(npmDebugLog)
  var opt = ""

  if (exist || title) opt += "?"
  if (exist) {
    body = "npm-debug.log:\n"
    body += "```\n"
    body += fs.readFileSync(npmDebugLog)
    body += "```\n"
  }
  if (title) opt += "title=" + encodeURIComponent(title)
  if (title && body) opt += "&"
  if (body) opt += "body=" + encodeURIComponent(body)

  var url = endpoint + opt
  opener(url, { command: npm.config.get("browser") }, cb)
}
