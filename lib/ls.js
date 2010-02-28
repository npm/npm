
// show the installed versions of a package

module.exports = exports = ls;
var npm = require("../npm"),
  exec = require("./utils/exec"),
  path = require("path"),
  fs = require("fs"),
  log = require("./utils").log;

function ls (pkg, cb) {
  if (!cb) {
    cb = pkg;
    pkg = false;
  }
  fs.readdir(npm.dir, function (er, packages) {
    if (er) return cb(er);
    packages = packages.filter(function (dir) {
      return (pkg ? dir === pkg : true) && dir.charAt(0) !== "."
    });
    if (!packages.length) {
      if (pkg) log(pkg, "not found");
      else log("nothing installed");
    }
    packages.forEach(function (package) {
      fs.readdir(path.join(npm.dir, package), function (er, versions) {
        if (er) return cb(er);
        versions.forEach(function (version) {
          log(package+"-"+version, "installed");
        });
      });
    });
  });
}
