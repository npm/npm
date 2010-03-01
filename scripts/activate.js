#!/usr/local/bin/node
var fs = require("fs"),
  version = process.env["npm.package.version"],
  bin = "/usr/local/bin/npm",
  versionedBin = "/usr/local/bin/npm-"+version;

fs.lstat(bin, function (er, st) {
  if (er) fs.unlink(bin, linkBin);
  else linkBin();
});

function linkBin (er) {
  if (er) throw er;
  fs.symlinkSync(versionedBin, bin, function (er) {
    if (er) throw er;
  });
}
