
// activate a version of a package
// this presumes that it's been installed
// no need to worry about dependencies, because they were
// installed into the child package anyhow.

var mkdir = require("./utils/mkdir-p"),
  processCb = require("./utils/process-cb");

module.exports = activate;

function activate (pkg, version, cb) {
  
}
