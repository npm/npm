var sys = require("sys");

function print (m, cr) { process.stdio.writeError(m+(cr===false?"":"\n")); return print };

var npm = require("./npm"), sys = require("sys");
npm.install("http://github.com/isaacs/npm/tarball/master", function (er) {
  if (er) {
    sys.error("\nFail!\n");
    throw er;
  }
  // sys.debug(sys.inspect(npm.get("npm")));
  npm.activate("npm", npm.get("npm")._versions[0], function (er, ok) {
    if (er) {
      sys.error("\nFailed to activate\n");
      throw er;
    }
    print("It worked!");
  });
})
