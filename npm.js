// the main guts

var npm = exports,
  queue = require("./src/queue.js").queue,
  http = require("/http.js");

include("/utils.js");

npm.install = function npm_install () {
  return dummyPromise()
};

npm.refresh = function npm_refresh () {
  // return dummyPromise()
  // get my list of sources.
  var p = new node.Promise();
  npm.getSources().addCallback(function (srcArr) {
    queue(srcArr, function (src) {
      return npm.refreshSource(src)
    }).addCallback(function () {
      p.emitSuccess();
    }).addErrback(function () {
      p.emitError();
    });
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
  debug("refresh the source: "+src);
  
  var p = new node.Promise();
  
  // var u = http.parseUri(src);
  // var httpClient = http.createClient(uri.port || 80, uri.host);
  // client.get(uri.path || "/", headers || {})
  
  http.cat(src, "utf-8", { "User-Agent" : "nodejs" })
    .addCallback(function (data) {
      debug("do something");
      p.emitSuccess(data);
    })
    .addErrback(function (er) {
      debug("error "+JSON.stringify(er)+ " " + JSON.stringify(res));
      p.emitError(er);
    });
    
  return p;
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
  