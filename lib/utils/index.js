module.exports = {
  set:set,
  get:get,
  has:has,
  bind:bind,
  method:method,
  log:log,
  array:array,
  succeed:succeed,
  fail:fail
};

function get (obj, key) {
  for (var i in obj) if (i.toLowerCase() === key.toLowerCase()) return obj[i];
  return undefined;
};

function set (obj, key, val) {
  for (var i in obj) if (i.toLowerCase() === key.toLowerCase()) return obj[i] = val;
  return obj[key] = val;
};

function has (obj, key) {
  for (var i in obj) if (obj.hasOwnProperty(i) && i.toLowerCase === key.toLowerCase()) return true;
  return false;
};

function bind (fn, o) {
  var args = array(arguments, 2);
  return function () {
    return fn.apply(o, args.concat(array(arguments)));
  };
};

function method (o, m) {
  var args = array(arguments, 2);
  return function () {
    return o[m].apply(o, args.concat(array(arguments)));
  };
};

function log (msg, pref) {
  pref = (pref && ": " + pref) || "";
  if (msg) msg = "npm"+pref+": "+msg;
  process.stdio.writeError(msg+"\n");
};

function array (arr, n) {
  return Array.prototype.slice.call(arr,n || 0);
};

function succeed (p) {
  return method(p, "emitSuccess", array(arguments,1));
};
function fail (p) {
  return method(p, "emitError", array(arguments,1));
}