module.exports = copy;
var fail = require("./index").fail,
  fs = require("fs"),
  Promise = require("events").Promise;

function copy (srcPath, destPath) {
  var p = new Promise;
  fs.open(srcPath, process.O_RDONLY|process.O_SYMLINK, 0755)
    .addErrback(fail(p, "Couldn't open "+srcPath))
    .addCallback(function (src) {
      fs.open(destPath, process.O_WRONLY|process.O_CREAT|process.O_TRUNC, 0755)
        .addErrback(fail(p, "Couldn't open "+destPath))
        .addCallback(function readAndWrite (dest) {
          fs.read(src, 16*1024, null, "binary")
            .addErrback(fail(p, "Couldn't read from "+srcPath))
            .addCallback(function (chunk) {
              if (!chunk) p.emitSuccess();
              else fs.write(dest, chunk, "binary")
                .addErrback(fail(p, "Couldn't write to "+destPath))
                .addCallback(function (written) {
                  if (written === 0) p.emitSuccess();
                  else readAndWrite(dest);
                });
            });
        });
    });
  return p;
  
};