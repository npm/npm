#!/usr/local/bin/node

var fs = require("fs"),
  version = process.env.npm_package_version,
  versionedBin = "/usr/local/bin/npm-"+version;

fs.lstat(versionedBin, function (er, st) {
  if (er) return;
  fs.unlink(versionedBin, function (er) {
    if (er) throw er;
  });
});
