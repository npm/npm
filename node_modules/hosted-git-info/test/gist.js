"use strict"
var HostedGit = require("../index")
var test = require("tap").test


test("fromUrl(gist url)", function (t) {
  function verify(host, label, branch) {
    var hostinfo = HostedGit.fromUrl(host)
    var hash = branch ? "#" + branch : ""
    t.ok(hostinfo, label)
    if (! hostinfo) return
    t.is( hostinfo.https(), "https://gist.github.com/222.git" + hash, label + " -> https" )
    t.is( hostinfo.git(), "git://gist.github.com/222.git" + hash, label + " -> git" )
    t.is( hostinfo.browse(), "https://gist.github.com/222" + (branch ? "/" + branch : ""), label + " -> browse" )
    t.is( hostinfo.bugs(), "https://gist.github.com/222", label + " -> bugs" )
    t.is( hostinfo.docs(), "https://gist.github.com/222" + (branch ? "/" + branch : ""), label + " -> docs" )
    t.is( hostinfo.ssh(), "git@gist.github.com:/222.git" + hash, label + " -> ssh" )
    t.is( hostinfo.sshurl(), "git+ssh://git@gist.github.com/222.git" + hash, label + " -> sshurl" )
    t.is( (""+hostinfo), "git+ssh://git@gist.github.com/222.git" + hash, label + " -> stringify" )
    if (hostinfo.user) {
      t.is( hostinfo.file("C"), "https://gist.githubusercontent.com/111/222/raw/"+(branch?branch+"/":"")+"C", label + " -> file" )
    }
  }

  verify("git@gist.github.com:222.git", "git@")
  verify("git@gist.github.com:/222.git", "git@/")
  verify("git://gist.github.com/222", "git")
  verify("git://gist.github.com/222.git", "git.git")
  verify("git://gist.github.com/222#branch", "git#branch", "branch")
  verify("git://gist.github.com/222.git#branch", "git.git#branch", "branch")

  require('./lib/standard-tests')(verify, "gist.github.com", "gist")

  t.end()
})

