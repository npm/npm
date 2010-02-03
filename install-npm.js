function print (m, cr) { process.stdio.writeError(m+(cr===false?"":"\n")); return print };

require("./npm").install("http://github.com/isaacs/npm/tarball/master", "npm")
  .addCallback(function () { print("It worked!") })
  .addErrback(function () {
    print
      ("Failure!\n")
      ([].join.call(arguments,"\n"))
      ("")
      (new Error().stack);
  });
