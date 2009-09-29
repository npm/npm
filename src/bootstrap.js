include("/utils.js");

var npmDir = node.path.dirname(node.path.dirname(__filename)),
  HOME = ENV.HOME,
  npm = require("../npm.js"),
  queuePromise = new node.Promise();

exports.bootstrap = function bootstrap () {
  node.stdio.writeError("npm: bootstrapping\n");
  queuePromise.addCallback(function () {
    node.stdio.write("ok");
  });
  next();
}

function statTester (thing, test, success, failure) {
  return function () {
    node.fs.stat(thing).addCallback(function (stats) {
      return (stats[test]()) ? success.apply(this, arguments)
        : failure.apply(this, arguments);
    }).addErrback(failure);
  };
};
// mkdir if not already existent.
// Doesn't handle mkdir -p, which would be nice, but is not necessary for this
function dirMaker (dir, mode, success, failure) {
  return statTester(dir, "isDirectory", success, function () {
    node.fs.mkdir(dir, mode).addErrback(failure).addCallback(success);
  });
};

function fail (msg) { return function () {
  node.stdio.writeError("npm bootstrap failed: "+msg);
}}

function next () {
  return script.shift()();
}

function done () {
  queuePromise.emitSuccess();
}


var script = [
  // make sure that the ~/.node_libraries and ~/.npm exist.
  dirMaker(node.path.join(HOME, ".node_libraries"), 0755, next, fail(
    "couldn't create " + node.path.join(HOME, ".node_libraries")
  )),
  dirMaker(node.path.join(HOME, ".npm"), 0755, next, fail(
    "couldn't create " + node.path.join(HOME, ".npm")
  )),
  
  // If no in ~/.npm/sources.json, then copy over the local one
  statTester(
    node.path.join(HOME, ".npm", "sources.json"), "isFile", next,
    function () {
      // try to copy the file over.
      // seems like there outta be a node.fs.cp
      node.fs.cat(
        node.path.join(npmDir, "sources.json")
      ).addErrback(fail(
        "couldn't read " + node.path.join(npmDir, "sources.json")
      )).addCallback(function (content) {
        node.fs.open(
          node.path.join(HOME, ".npm", "sources.json"),
          node.O_WRONLY | node.O_TRUNC | node.O_CREAT,
          0666
        ).addErrback(fail(
          "couldn't open "+node.path.join(HOME, ".npm", "sources.json")+" for writing"
        )).addCallback(function (fd) {
          node.fs.write(fd, content, 0).addErrback(fail(
            "couldn't write to "+node.path.join(HOME, ".npm", "sources.json")
          )).addCallback(next);
        });
      });
    }
  ),
  
  // call npm.refresh()
  function () {
    npm.refresh().addErrback(fail(
      "Failed calling npm.refresh()"
    )).addCallback(next);
  },
  
  // call npm.install("--force", "npm")
  function () {
    npm.install("--force", "npm").addErrback(fail(
      "Failed installing npm with npm"
    )).addCallback(next);
  },
  
  done
];
  
