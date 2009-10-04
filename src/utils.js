exports.get = function get (obj, key) {
  for (var i in obj) if (i.toLowerCase() === key.toLowerCase()) return obj[i];
  return undefined;
};
exports.set = function set (obj, key, val) {
  for (var i in obj) if (i.toLowerCase() === key.toLowerCase()) return obj[i] = val;
  return obj[key] = val;
};

exports.bind = function bind (o, fn) {
  return function () {
    return fn.apply(o, arguments);
  };
};

exports.method = function method (o, fn) {
  return function () {
    return o[fn].apply(o, arguments);
  };
};

exports.log = function log (msg, pref) {
  pref = (pref && ": " + pref) || "";
  if (msg) msg = "npm"+pref+": "+msg;
  node.stdio.writeError(msg+"\n");
};

exports.array = function array (arr) {
  return Array.prototype.slice.call(arr,0);
};
