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
  obj[key] = val;
  if (val && val.version && key.indexOf("-"+val.version) !== -1) {
    key = key.replace("-"+val.version, "");
    var reg = get(obj, key) || {};
    set(reg, val.version, val);
    set(obj, key, reg);
    reg._versions = get(reg, "_versions") || [];
    reg._versions.push(val.version);
  }
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
  if (!o) {
    throw new Error("invalid object: "+o);
  }
  return function () {
    return o[m].apply(o, args.concat(array(arguments)));
  };
};

function log (msg, pref) {
  pref = (pref && ": \033[35m" + pref+"\033[0m") || "";
  if (msg) msg = "\033[31mnpm\033[0m"+pref+": "+msg;
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