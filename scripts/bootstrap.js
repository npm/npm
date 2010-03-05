#!/usr/bin/env node

var sys = require("sys");

function print (m, cr) { process.stdio.writeError(m+(cr===false?"":"\n")); return print }

require("../npm").install("http://github.com/isaacs/npm/tarball/master", function (er, ok) {
  if (er) {
    sys.error("\nFailed after "+ok.length+" step(s)\n");
    throw er;
  } else print("It worked!");
});
