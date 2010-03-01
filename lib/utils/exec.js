
var log = require("../utils").log;

module.exports = function exec (cmd, args, cb) {
  log(cmd+" "+args.map(JSON.stringify).join(" "), "exec");
  process.createChildProcess(cmd, args)
    .addListener("error", function (chunk) {
      if (chunk) process.stdio.writeError(chunk)
    })
    .addListener("output", function (chunk) {
      if (chunk) process.stdio.write(chunk)
    })
    .addListener("exit", function (code) {
      if (code) cb(new Error("`"+cmd+"` failed with "+code));
      else cb(null, code);
    });
};
