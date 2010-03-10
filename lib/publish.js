
// get a url to a tarball, fetch it, read the package.json, and
// publish to the registry.

module.exports = publish;

var fs = require("fs"),
  path = require("path"),
  chain = require("./utils/chain"),
  rm = require("./utils/rm-rf"),
  readJson = require("./utils/read-json"),
  exec = require("./utils/exec"),
  mkdir = require("./utils/mkdir-p"),
  log = require("./utils/log"),
  semver = require("./utils/semver"),
  fetch = require("./utils/fetch"),
  registry = require("./utils/registry"),
  npm = require("../npm"),
  url = require("url");
  

function publish (tarball, cb) {
  var u = url.parse(tarball);
  if (!(u && u.protocol && u.host)) {
    return cb(new Error("Invalid remote tarball url: "+tarball));
  }

  var targetDir = path.join(npm.tmp,
      tarball.replace(/[^a-zA-Z0-9]/g, "-")+"-"+ Date.now()+"-"+Math.random()),
    targetFile = targetDir + ".tgz";
  
  chain(
    [mkdir, npm.tmp],
    [fetch, tarball, targetFile],
    [unpackTar, targetFile, targetDir],
    function (cb) {
      readJson(path.join(targetDir, "package.json"), function (er, data) {
        if (er) return cb(er);
        registry.publish(data, tarball, cb);
      });
    },
    // cleanup
    [rm, targetFile],
    [rm, targetDir],
    cb
  );
}

function unpackTar (tarball, unpackTarget, cb) {
  exec("tar", ["xzvf", tarball, "--strip", "1", "-C", unpackTarget], cb);
}
