
// activate a version of a package
// this presumes that it's been installed
// no need to worry about dependencies, because they were
// installed into the child package anyhow.

var mkdir = require("./utils/mkdir-p"),
  exec = require("./utils/exec"),
  npm = require("../npm"),
  fs = require("fs"),
  log = require("./utils").log,
  path = require("path"),
  rm = require("./utils/rm-rf"),
  chain = require("./utils/chain"),
  exec = require("./utils/exec");

module.exports = activate;

function activate (pkg, version, cb) {
  // make sure package and version exists.
  // If there's already an active version, then deactivate it.
  // first, link .npm/{pkg}/{version} to .npm/{pkg}/{active}
  // then, link the things in the root without a version to the active one.
  
  var from = path.join(npm.dir, pkg, version),
    to = path.join(npm.dir, pkg, "active");
  link(from, to, function (er) {
    if (er) return cb(er);
    // now link the main and libs from the root to the active folder.
    var fromMain = path.join(npm.dir, pkg, "active/main.js"),
      toMain = path.join(npm.root, pkg+".js"),
      fromLib = path.join(npm.dir, pkg, "active/lib"),
      toLib = path.join(npm.root, pkg);
    chain(
      [function (cb) {
        fs.stat(fromMain, function (er, stat) {
          if (er) return cb();
          link(fromMain, toMain, cb);
        });
      }],
      [function (cb) {
        fs.stat(fromLib, function (er, stat) {
          if (er) return cb();
          link(fromLib, toLib, cb);
        });
      }],
      cb
    );
  });
}

function link (from, to, cb) {
  chain(
    [fs, "stat", from],
    [function (cb) { rm(to, function () { cb() }) }],
    [exec, "ln", ["-s", from, to]],
    [function (cb) {
      // TODO: save that this is active.
      cb();
    }],
    cb
  );
}
