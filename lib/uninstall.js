
// remove a package.  if it has dependents, then fail, and demand that they be
// uninstalled first.  If activee, then fail, and depand that it be deactivated
// first.

module.exports = uninstall;

var rm = require("./utils/rm-rf"),
  fs = require("fs"),
  log = require("./utils/log"),
  readJson = require("./utils/read-json"),
  path = require("path"),
  npm = require("../npm"),
  chain = require("./utils/chain"),
  lifecycle = require("./utils/lifecycle");

function uninstall (name, version, cb) {
  var pkgdir = path.join(npm.dir, name, version),
    jsonFile = path.join(pkgdir, "package", "package.json"),
    active = path.join(npm.dir, name, "active"),
    libdir = path.join(npm.root, name+"-"+version),
    mainjs = libdir + ".js",
    dependents = path.join(pkgdir, "dependents");
  
  chain(
    // if active, then fail.
    [log, "about to remove: " + pkgdir, "uninstall"],
    function (cb) {
      fs.readlink(active, function (er, active) {
      if (path.basename(active||"") === version) return cb(new Error(
        "cannot remove active package.\n"+
        "      npm deactivate "+name+" "+version+"\n"+
        "and then retry."));
      return cb();
    })},
    [log, "not active", "uninstall"],
    // if has dependents, then fail
    function (cb) {
      fs.readdir(dependents, function (er, children) {
      if (children && children.length) return cb(new Error(
        name+"-"+version+" depended upon by \n"+
        "      " + require("sys").inspect(children)+"\n"+
        "remove them first."));
      return cb();
    })},
    // remove the whole thing.
    function (cb) { readJson(jsonFile, function (er, data) {
      if (er) return cb(er);
      chain(
        [lifecycle, data, "preuninstall"],
        [lifecycle, data, "uninstall"],
        [rm, pkgdir],
        [removeBins, data],
        [rm, mainjs],
        [rm, libdir],
        // if that was the last one, then remove the whole thing.
        function (cb) { pkgdir = path.dirname(pkgdir); cb() },
        function (cb) { fs.readdir(pkgdir, function (versions) {
          if (versions && versions.length) return cb();
          rm(pkgdir, cb);
        })},
        [lifecycle, data, "postuninstall"],
        cb
      );
    })},
    cb
  );
}

function removeBins (data, cb) {
  if (!data.bin) return cb();
  var binroot = path.join(process.installPrefix, "bin");
  (function R (bins) {
    if (!bins.length) return cb();
    rm(binroot + "/" + bins.pop(), cb);
  })(Object.getOwnProperties(data.bin));    
}
