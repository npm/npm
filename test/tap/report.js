var fs = require("fs")
var path = require("path")
var rimraf = require("rimraf")
var test = require('tap').test
var common = require("../common-tap.js")
var opts = { cwd: path.join(__dirname, "report") }
var outFile = path.join(__dirname, "_output")
var npmDebugLog = path.join(__dirname, "report/npm-debug.log")

test("setup", function (t) {
  var s = "#!/usr/bin/env bash\n" +
          "echo \"$@\" > " +  JSON.stringify(__dirname) + "/_output\n"
  var e = fs.readFileSync(__dirname + "/report/_npm-debug.log")
  fs.writeFileSync(__dirname + "/_script.sh", s, "ascii")
  fs.writeFileSync(npmDebugLog, e, "ascii")
  fs.chmodSync(__dirname + "/_script.sh", "0755")
  t.pass("made script")
  t.end()
})

test("report test", function (t) {
  var endpoint = "https://github.com/npm/support-cli/issues/new?"
  var title = "test title"
  var body  = "npm-debug.log:\n"
  body += "```\n"
  body += fs.readFileSync(npmDebugLog, "ascii")
  body += "```\n\n"
  common.npm([
    "report",
    "--title=\"test title\"",
    "--browser=" + path.join(__dirname, "/_script.sh")
  ], opts, function (err, code, stdout, stderr) {
    t.ifError(err, "report ran without issue")
    t.notOk(stderr, "should have no stderr")
    t.equal(code, 0, "exit ok")
    var res = fs.readFileSync(outFile, "ascii")
    var hash = {}
    var queries = res.replace(endpoint, "").split("&")
    var query = queries.map(function(q) { return q.split("=") })
    var i = queries.length
    while (i--) hash[query[i][0]] = decodeURIComponent(query[i][1])
    t.equal(hash.title, title, "title ok")
    t.equal(hash.body, body, "body ok")
    rimraf.sync(outFile)
    t.end()
  })
})

test("cleanup", function (t) {
  fs.unlinkSync(__dirname + "/_script.sh")
  t.pass("cleaned up")
  t.end()
})
