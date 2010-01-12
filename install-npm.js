function print (m, cr) { process.stdio.writeError(m+(cr===false?"":"\n")); return print };

require("./npm").install("http://github.com/isaacs/npm/tarball/rewrite", "npm")
  .addCallback(function () { print("It worked!") })
  .addErrback(function () {
    print
      ("Failure!\n")
      ([].slice.call(arguments,0).join("\n"))
      ("")
      (new Error().stack);
  });
