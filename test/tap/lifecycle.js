var test = require("tap").test
var npm = require('../../')
var path = require("path")
var pkg = path.resolve(__dirname, "..", "..")
var lifecycle = require('../../lib/utils/lifecycle')
var Conf = require("npmconf").Conf

test("lifecycle: make env correctly", function (t) {
  npm.load(function() {
    var env = lifecycle.makeEnv(pkg)

    var conf = new Conf()
    conf.addEnv(env)
    conf.keys.forEach(function (key) {
      t.equal(conf.get(key), npm.config.get(key))
    })
    t.end()
  })
})
