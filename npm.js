// the main guts

// @TODO Don't fetch the whole catalog.json file.
// Use the split-up single-package files instead.

var npm = exports,
  http = require("/http.js");

include("/utils.js");
include("./src/queue.js");

var CATALOG = {};
var REQS = [], INSTALL_SET = {}, INSTALL_OPTS = {};

function buildInstallSet (pkg) {
  var p = new node.Promise();
  var REQS = [pkg];
  var INSTALL_SET = {};
  var WAITING = 0;
  
  setTimeout(function installSetBuilder () {
    var set = INSTALL_SET
    if (REQS.length === 0) {
      // done, move onto next phase.
      p.emitSuccess(set);
      return;
    }
    var pkg = REQS.shift();
    // log("--- pkg = "+pkg);
    if (set.hasOwnProperty(pkg)) {
      // just pass by this one.
      setTimeout(installSetBuilder);
    } else {
      // log("not already in set: "+pkg);
      WAITING ++;
      set[pkg] = npm.readCatalog(pkg);
      set[pkg].addErrback(fail(p, "Failed to fetch catalog data for "+pkg));
      set[pkg].addCallback(function (data) {
        WAITING --;
        log("adding: "+pkg);
        set[pkg] = data;
        if (data.hasOwnProperty("require")) {
          REQS = REQS.concat(data.require);
          setTimeout(installSetBuilder);
        } else if (WAITING <= 0) p.emitSuccess(set);
      });
    }
  });
  
  return p;
};


npm.installPackages = function npm_installPackages (set, opt) {
  var p = new node.Promise();
  
  stack(set, function (data, name) {
    return _install(name, data, opt);
  }).addErrback(fail(p, "Failed to install package set. @TODO: rollback"))
    .addCallback(function () { p.emitSuccess() });

  return p;
};

function _install (name, data, opt) {
  var p = new node.Promise();
  setTimeout(function () {
    log("@todo: install for " + JSON.stringify(name));
    p.emitSuccess();
  });
  return p;
};

npm.install = function npm_install (pkg, opt) {
  var p = new node.Promise();
  opt = opt || {};
  
  buildInstallSet(pkg)
    .addErrback(fail(p,"Failed building requirements for "+pkg))
    .addCallback(function (set) {
      log("Install set: "+JSON.stringify(set));
      npm.installPackages(set, opt)
        .addErrback(fail(p, "Failed to install"))
        .addCallback(function () {
          log("success!");
          p.emitSuccess();
        });
    });
  // recurse through dependencies, then for each:
  // fetch the tarball
  // unpack in $HOME/.node_libraries/<package>/
  // If it's got a build step, then cd into the folder, and run it.
  // if it's a lib, then write ~/.node_libraries/<package>.js as
  //   exports = require(<package>/<lib.js>)
  // If it's got a start step, then run the start command.
  
  
  
  
  
  return p;
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

npm.readCatalog = function npm_readCatalog (pkg) {
  var p = new node.Promise(),
    path = node.path.join(ENV.HOME, ".npm", "catalog.json");
  node.fs.cat(
    path
  ).addErrback(fail(p,
    "couldn't open "+path+" for reading"
  )).addCallback(function (data) {
    try {
      data = JSON.parse(data);
      if (pkg in data) {
        p.emitSuccess(data[pkg]);
      }
      else fail(p, pkg+" not in catalog")();
    } catch (ex) {
      fail(p, "Error parsing catalog: "+ex.message)();
    }  
  });
  return p;
};

npm.writeCatalog = function npm_writeCatalog () {
  log("writing catalog");
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
      log("Refreshing data from "+src);
      try {
        data = JSON.parse(data);
        merge(CATALOG, data);
        p.emitSuccess(data);
      } catch (ex) { p.emitError(ex); return; }
    });
  return p;
};

function merge (dest, src) {
  for (var i in src) if (!dest.hasOwnProperty(i)) dest[i] = src[i];
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
  log("failure:  "+msg);
}};

function log (msg) {
  node.stdio.writeError("npm: "+msg+"\n");
}