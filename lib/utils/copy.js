module.exports = copy;
var fail = require("./index").fail;

function copy (srcPath, destPath) {
  var p = new process.Promise;
  posix.open(srcPath, process.O_RDONLY|process.O_SYMLINK, 0755)
    .addErrback(fail(p, "Couldn't open "+srcPath))
    .addCallback(function (src) {
      posix.open(destPath, process.O_WRONLY|process.O_CREAT|process.O_EXCL, 0755)
        .addErrback(fail(p, "Couldn't open "+destPath))
        .addCallback(function readAndWrite (dest) {
          posix.read(src, 16*1024)
            .addErrback(fail(p, "Couldn't read from "+srcPath))
            .addCallback(function (chunk) {
              posix.write(dest, chunk, "binary")
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