// the main guts

var npm = exports,
  queue = require("./src/queue.js").queue,
  http = require("/http.js");

include("/utils.js");

npm.install = function npm_install () {
  return dummyPromise()
};

npm.refresh = function npm_refresh () {
  // get my list of sources.
  var p = new node.Promise();
  npm.getSources().addCallback(function (srcArr) {
    queue(srcArr, function (src) {
      return npm.refreshSource(src)
    }).addCallback(function () {
      node.fs.unlink(".npm.catalog.tmp");
      npm.writeCatalog()
        .addCallback(function () { p.emitSuccess(); })
        .addErrback(function () { p.emitError(); });
    }).addErrback(function () { p.emitError(); });
  });
  return p;
};

var CATALOG = {};
npm.writeCatalog = function npm_writeCatalog () {
  var p = new node.Promise();
  
  node.fs.open(
    node.path.join(ENV.HOME, ".npm", "catalog.json"),
    node.O_WRONLY | node.O_TRUNC | node.O_CREAT,
    0666
  ).addErrback(fail(p,
    "couldn't open "+node.path.join(ENV.HOME, ".npm", "catalog.json")+" for writing"
  )).addCallback(function (fd) {
    try {
      var data = JSON.stringify(CATALOG);
    } catch (ex) {
      return fail(p, "Couldn't stringify catalog data")();
    }
    node.fs.write(fd, data, 0).addErrback(fail(p,
      "couldn't write to "+node.path.join(ENV.HOME, ".npm", "catalog.json")
    )).addCallback(function () { p.emitSuccess() });
  });
  
  return p;
};

npm.getSources = function npm_getSources () {
  var p = new node.Promise();
  node.fs.cat(node.path.join(ENV.HOME, ".npm", "sources.json"))
    .addErrback(function () {
      p.emitError(new Error(
        "Couldn't read " + node.path.join(ENV.HOME, ".npm", "sources.json") + "\n"
      ));
    })
    .addCallback(function (data) {
      try {
        data = JSON.parse(data);
        if (data) p.emitSuccess(data);
      } catch (ex) { p.emitError(ex); return; }
    });
  return p;
};  

npm.refreshSource = function npm_refreshSource (src) {
  var p = new node.Promise();
  http.cat(src)
    .addErrback(fail(p, "Couldn't load "+src))
    .addCallback(function (data) {
      try {
        data = JSON.parse(data);
        merge(CATALOG, data);
        p.emitSuccess(data);
      } catch (ex) { p.emitError(ex); return; }
    });
  return p;
};

function merge (dest, src) {
  for (var i in src) dest[i] = src[i];
};

function dummyPromise (name) {
  var promise = new node.Promise();
  name = name || arguments.callee.caller.name;
  setTimeout(function () {
    node.stdio.writeError("TODO: implement "+ name + "\n");
    promise.emitSuccess("dummy");
  });
  return promise;
};

function fail (p, msg) { return function () {
  p.emitError();
  debug("npm failed: "+msg);
}};
