"use strict"
var test = require("tap").test
var requireInject = require("require-inject")
var path = require("path")

var re = {
  tarball: /[\/\\]a.tar.gz$/,
  packagedir: /[\/\\]b$/,
  packagejson: /[\/\\]b[\/\\]package.json$/,
  nonpackagedir: /[\/\\]c$/,
  nopackagejson: /[\/\\]c[\/\\]package.json$/,
  remotename: /[\/\\]d$/
}

var rps = requireInject("../index", {
  "fs": {
    "stat": function (path, callback) {
      if (re.tarball.test(path)) {
        callback(null,{isDirectory:function(){ return false }})
      }
      else if (re.packagedir.test(path)) {
        callback(null,{isDirectory:function(){ return true }})
      }
      else if (re.packagejson.test(path)) {
        callback(null,{})
      }
      else if (re.nonpackagedir.test(path)) {
        callback(null,{isDirectory:function(){ return true }})
      }
      else if (re.nopackagejson.test(path)) {
        callback(new Error("EFILENOTFOUND"))
      }
      else if (re.remotename.test(path)) {
        callback(new Error("EFILENOTFOUND"))
      }
      else {
        throw new Error("Unknown stat fixture path: "+path)
      }
    }
  }
})

test("realize-package-specifier", function (t) {
  t.plan(8)
  rps("a.tar.gz", function (err, result) {
    t.is(result.type, "local", "local tarball")
  })
  rps("b", function (err, result) {
    t.is(result.type, "directory", "local package directory")
  })
  rps("c", function (err, result) {
    t.is(result.type, "range", "remote package, non-package local directory")
  })
  rps("d", function (err, result) {
    t.is(result.type, "range", "remote package, no local directory")
  })
  rps("file:./a.tar.gz", function (err, result) {
    t.is(result.type, "local", "local tarball")
  })
  rps("file:./b", function (err, result) {
    t.is(result.type, "directory", "local package directory")
  })
  rps("file:./c", function (err, result) {
    t.is(result.type, "local", "non-package local directory, specified with a file URL")
  })
  rps("file:./d", function (err, result) {
    t.is(result.type, "local", "no local directory, specified with a file URL")
  })
})
