
// like rm -rf

module.exports = rm;

var fs = require("fs"),
  path = require("path"),
  sys = require("sys");

function rm (p, cb) {
  
  if (!p) return cb(new Error("Trying to rm nothing?"));
  
  fs.lstat(p, function (er, s) {
    if (er) return cb();
    if (s.isFile() || s.isSymbolicLink()) {
      fs.unlink(p, cb);
    } else {
      fs.readdir(p, function (er, files) {
        if (er) return cb(er);
        (function rmFile (f) {
          if (!f) {
            fs.rmdir(p, cb);
          } else {
            rm(path.join(p, f), function (er) {
              if (er) return cb(er);
              rmFile(files.pop());
            });
          }
        })(files.pop());
      });
    }
  })
}
