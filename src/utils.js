exports.get = function get (obj, key) {
  for (var i in obj) if (i.toLowerCase() === key.toLowerCase()) return obj[i];
  return undefined;
};

// fn is a function that returns a promise.
// this function returns a promise that succeeds no matter what.
exports.succeed = function succeed (fn) { return function () {
  var p = new node.Promise;
  var s = method(p, "emitSuccess");
  fn().addErrback(s).addCallback(s);
  return p;
}};
exports.set = function set (obj, key, val) {
  for (var i in obj) if (i.toLowerCase() === key.toLowerCase()) return obj[i] = val;
  return obj[key] = val;
};

exports.bind = function bind (o, fn) {
  function bound () {
    return fn.apply(o, arguments);
  };
  bound.toString = function () { return fn.toString() + " [bound]" };
  return bound;
};

exports.curry = function curry (fn) {
  var curryargs = array(arguments, 1);
  function curried () {
    return fn.apply(this, curryargs.concat(array(arguments)));
  };
  curried.toString = function () { return fn.toString() + " [curried]" };
  return curried;
};

exports.method = function method (o, fn) {
  function method () {
    return o[fn].apply(o, arguments);
  };
  method.toString = function () { return o[fn].toString() + " [method]" };
  return method
};

exports.log = function log (msg, pref) {
  pref = (pref && ": " + pref) || "";
  if (msg) msg = "npm"+pref+": "+msg;
  node.stdio.writeError(msg+"\n");
};

exports.array = function array (arr, n) {
  n = n || 0;
  return Array.prototype.slice.call(arr,n);
};
