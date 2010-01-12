
var utils = require("./index");

exports.queue = function queue (items, fn) {
  return new Queue(items, fn).start();
};
exports.stack = function stack (items, fn) {
  return new Queue(items, fn, true).start();
};

// items are the things
// fn is what to do to each one.
// promise is the promise that is fulfilled when it works.
function Queue (items, fn, reverse) {
  this.items = [];
  this.keys = [];
  this.results = {};
  var insert = reverse ? "unshift" : "push";
  for (var i in items) {
    this.items[insert](items[i]);
    this.keys[insert](i);
  }
  this.fn = fn;
}
function Queue_next () {
  if (this.items.length <= 0) return this.promise.emitSuccess(this.results);
  
  var np = new process.Promise(),
    self = this;
  np.addCallback(function (key, args) {
    self.results[key] = args;
    Queue_next.call(self);
  }).addErrback(utils.fail(self.promise));
  
  setTimeout(function () {
    var key = self.keys.shift(), item = self.items.shift();
    try {
      var fnP = self.fn.call(null, item, key);
      if (
        fnP &&
        typeof(fnP.addCallback === "function") &&
        typeof(fnP.addErrback === "function")
      ) fnP.addCallback(function () {
          np.emitSuccess(key, array(arguments));
        }).addErrback(function () {
          np.emitError(key, item, array(arguments));
        });
      else np.emitSuccess(key, [fnP]);
    } catch (ex) {
      np.emitError(key, item, [ex]);
    }
  });
  return this.promise;
};

Queue.prototype = {
  start : function Queue_start () {
    if (this._started) return;
    this._started = true;
    this.promise = new process.Promise();
    this.promise.addCallback((function (q) { return function () {q.items=[]} })(this));
    return Queue_next.call(this);
  },
  push : function (i) { this.items.push(i); }
};