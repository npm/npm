var test = require("tap").test
var npm = require("../../lib/npm.js")
var requireInject = require('require-inject');

npm.load({}, function () {
  var cache = requireInject("../../lib/cache.js",{
    "graceful-fs": {
      stat: function (file, cb) {
        process.nextTick(function() {
          switch (file) {
          case "named":
            cb(new Error("ENOENT"))
            break
          case "file.tgz":
            cb(null,{isDirectory:function(){return false}})
            break
          case "dir-no-package":
            cb(null,{isDirectory:function(){return true}})
            break
          case "dir-no-package/package.json":
            cb(new Error("ENOENT"))
            break
          case "dir-with-package":
            cb(null,{isDirectory:function(){return true}})
            break
          case "dir-with-package/package.json":
            cb(null,{})
            break
          default:
            console.error("Unknown test file passed to stat:",file)
            process.exit(1)
          }
        })
      }
    },
    "../../lib/cache/add-named.js": function addNamed (name,version,data,cb) {
      cb(null,"addNamed")
    },
    "../../lib/cache/add-local.js": function addLocal (name,data,cb) {
      cb(null,"addLocal")
    }
  })

  test("npm install localdir fallback", function(t) {
    t.plan(4)
    cache.add("named", null, false, function (er,which){
      t.is(which, "addNamed", "registry package name") })
    cache.add("file.tgz", null, false, function (er,which){
      t.is(which, "addLocal", "local file") })
    cache.add("dir-no-package", null, false, function (er,which){
      t.is(which, "addNamed", "local directory w/o package.json") })
    cache.add("dir-with-package", null, false, function (er,which){
      t.is(which,"addLocal", "local directory w/ package.json") })
  })
})
