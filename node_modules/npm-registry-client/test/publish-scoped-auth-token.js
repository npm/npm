var tap = require("tap")
var crypto = require("crypto")
var fs = require("fs")

var toNerfDart = require("../lib/util/nerf-dart.js")
var server = require("./lib/server.js")
var common = require("./lib/common.js")

var configuration = {"always-auth" : true}

var authKey = toNerfDart(common.registry) + ":_auth"
configuration[authKey] = new Buffer("username:password").toString("base64")

var emailKey = toNerfDart(common.registry) + ":email"
configuration[emailKey] = "ogd@aoaioxxysz.net"

var tokenKey = toNerfDart(common.registry) + ":_authToken"
configuration[tokenKey] = "of-glad-tidings"

var client = common.freshClient(configuration)

tap.test("publish", function (t) {
  // not really a tarball, but doesn't matter
  var tarball = require.resolve("../package.json")
  var pd = fs.readFileSync(tarball, "base64")
  var pkg = require("../package.json")
  pkg.name = "@npm/npm-registry-client"

  server.expect("/@npm%2fnpm-registry-client", function (req, res) {
    t.equal(req.method, "PUT")
    t.equal(req.headers.authorization, "Bearer of-glad-tidings")

    var b = ""
    req.setEncoding("utf8")
    req.on("data", function (d) {
      b += d
    })

    req.on("end", function () {
      var o = JSON.parse(b)
      t.equal(o._id, "@npm/npm-registry-client")
      t.equal(o["dist-tags"].latest, pkg.version)
      t.has(o.versions[pkg.version], pkg)
      t.same(o.maintainers, [ { name: "username", email: "ogd@aoaioxxysz.net" } ])
      t.same(o.maintainers, o.versions[pkg.version].maintainers)
      var att = o._attachments[ pkg.name + "-" + pkg.version + ".tgz" ]
      t.same(att.data, pd)
      var hash = crypto.createHash("sha1").update(pd, "base64").digest("hex")
      t.equal(o.versions[pkg.version].dist.shasum, hash)
      res.statusCode = 201
      res.json({created:true})
    })
  })

  client.publish(common.registry, pkg, tarball, function (er, data) {
    if (er) throw er
    t.deepEqual(data, { created: true })
    t.end()
  })
})
