
// show the installed versions of a package

module.exports = exports = ls;
var npm = require("../npm"),
  exec = require("./utils/exec"),
  path = require("path"),
  fs = require("fs"),
  log = require("./utils").log;

function ls (cb) {
  cb = arguments[arguments.length - 1];
  fs.readdir(npm.dir, function (er, packages) {
    if (er) return cb(er);
    packages.filter(function (dir) {
      return dir.charAt(0) !== "."
    }).forEach(function (package) {
      fs.readdir(path.join(npm.dir, package), function (er, versions) {
        if (er) return cb(er);
        versions.forEach(function (version) {
          log(package+"-"+version, "installed");
        });
      });
    });
  });
}
