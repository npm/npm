
// activate a version of a package
// this presumes that it's been installed
// no need to worry about dependencies, because they were
// installed into the child package anyhow.

var mkdir = require("./utils/mkdir-p"),
  exec = require("./utils/exec");

module.exports = activate;

function activate (pkg, version, cb) {
  
}
