var test = require("tap").test
    , fs = require("fs")
    , path = require("path")
    , npm = require("../../")
    , rimraf = require("rimraf")

test("install: does not erroneously throw ECYCLE", function (t) {
    t.plan(1)

    setup(function () {
        npm.install(".", function (err) {
            if (err) return t.fail(err)
            t.ok(true, "npm install proceeded without error")
        })
    })
})

function setup (cb) {
    var notCyclicPackageDir = path.join(__dirname, "not-cyclic");
    process.chdir(notCyclicPackageDir)

    npm.load(function () {
        var notCyclicNodeModulesDir = path.join(notCyclicPackageDir, "node_modules");
        rimraf.sync(notCyclicNodeModulesDir)
        fs.mkdirSync(notCyclicNodeModulesDir)
        cb()
    })
}
