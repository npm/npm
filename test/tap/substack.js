var test = require("tap").test
var common = require("../common-tap.js")
var opts = { cwd: __dirname }
var isms = [ "\033[32mbeep \033[35mboop\033[m\n"
           , "Replace your configs with services\n"
           , "SEPARATE ALL THE CONCERNS!\n"
           , "MODULE ALL THE THINGS!\n"
           , "\\o/\n"
           , "but first, burritos\n"
           , "full time mad scientist here\n"
           , "c/,,\\\n"
           ]

test("substack said...", function (t) {
  common.npm([
    'substack'
  ], opts, function (err, code, stdout, stderr) {
    t.ifError(err, "without issue")
    t.notOk(stderr, "has no stderr")
    t.unlike(isms.indexOf(stdout), -1, stdout)
    t.equal(code, 0, "and exit ok")
    t.end()
  })
})
