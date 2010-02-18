
var utils = require("./index"),
  Promise = require("events").Promise,
  sys = require("sys");

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
  
  var np = new Promise(),
    self = this;
    
  np.addCallback(function (key, result) {
    self.lastResult = self.results[key] = result;
    self.next();
  }).addErrback(utils.fail(self.promise));
  
  process.nextTick(function () {
    var key = self.keys.shift(), item = self.items.shift();
    try {
      var fnP = self.fn.call(null, item, key, self.lastResult);
      if (
        fnP &&
        typeof(fnP.addCallback === "function") &&
        typeof(fnP.addErrback === "function")
      ) fnP.addCallback(function (result) {
          np.emitSuccess(key, result);
        }).addErrback(function (result) {
          np.emitError(key, item, result);
        });
      else process.nextTick(function () {
        np.emitSuccess(key, fnP);
      });
    } catch (ex) {
      np.emitError(key, item, ex);
    }
  });
  return this.promise;
};

Queue.prototype = {
  start : function Queue_start () {
    if (this._started) return;
    this._started = true;
    this.promise = new Promise();
    this.promise.addCallback((function (q) { return function () {q.items=[]} })(this));
    return this.next();
  },
  next : Queue_next,
  push : function (i) { this.items.push(i); }
};