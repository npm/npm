
// See http://semver.org/

exports.compare = compare;
exports.satisfies = satisfies;
exports.gt = gt;
exports.lt = lt;
exports.valid = valid;

var semver = "([0-9]+\\.){2}[0-9]+([a-zA-Z-][a-zA-Z0-9-]*)?|\\*",
  semverExpr = new RegExp(semver),
  semverOnlyExpr = new RegExp("^("+semver+")$");
function valid (version, t) {
  version = version.trim();
  // allow a "v" prefix, but strip it.
  if (version.charAt(0) === "v") version = version.substr(1);
  return !!semverOnlyExpr.exec(version) && version;
}

// range can be one of:
// "1.0.3 - 2.0.0" range, inclusive, like ">=1.0.3 <=2.0.0"
// ">1.0.2" like 1.0.3 - 9999.9999.9999
// ">=1.0.2" like 1.0.2 - 9999.9999.9999
// "<2.0.0" like 0.0.0 - 1.9999.9999
// ">1.0.2 <2.0.0" like 1.0.3 - 1.9999.9999
var rangeExpr = new RegExp("^(" + semver + ")\\s+-\\s+(" + semver + ")$"),
  rangeRepl = ">=$1 <=$4",
  starExpr = /(<|>)?=?\*/g,
  starRepl = "";
function satisfies (version, range) {
  version = valid(version);
  if (!version) return false;
  range = range.trim()
    .replace(rangeExpr, rangeRepl)
    .replace(starExpr, starRepl)
    .split(/\s+/);
  for (var i = 0, l = range.length; i < l; i ++) if (range[i]) {
    var r = range[i],
      gtlt = r.charAt(0) === ">" ? gt : r.charAt(0) === "<" ? lt : false,
      eq = r.charAt(!!gtlt) === "=",
      sub = (!!eq) + (!!gtlt);
    r = valid(r.substr(sub));
    if (!r) return false;
    if (!gtlt) eq = true;
    if (eq && r === version) continue;
    if (gtlt && gtlt(version, r)) continue;
    return false;
  }
  return true;
}

// return v1 > v2 ? 1 : -1
function compare (v1, v2) {
  return v1 === v2 ? 0 : gt(v1, v2) ? 1 : -1;
}

function lt (v1, v2) { return gt(v2, v1) }

// return v1 > v2
function gt (v1, v2) {
  v1 = valid(v1);
  v2 = valid(v2);
  if (!v1 || !v2) return false;
  
  var tag1 = semverExpr.exec(v1)[2] || "",
    tag2 = semverExpr.exec(v2)[2] || "";

  v1 = v1.split(/\./);
  v2 = v2.split(/\./);
  for (var i = 0; i < 3; i ++) {
    if ((+v1[i]) > (+v2[i])) return true;
  }
  // no tag is > than any tag, or use lexicographical order.
  return (tag2 && !tag1 || tag1 > tag2);
}


if (module.id !== ".") return;  // tests below


var assert = require("assert");

[
  ["0.0.0", "0.0.0foo"],
  ["0.0.1", "0.0.0"],
  ["1.0.0", "0.9.9"],
  ["0.10.0", "0.9.0"],
  ["0.99.0", "0.10.0"],
  ["2.0.0", "1.2.3"]
].forEach(function (v) {
  assert.ok(gt(v[0], v[1]), v[0]+" > "+v[1]);
});

[
  ["1.0.0 - 2.0.0", "1.2.3"],
  [">=1.0.0", "1.0.0"],
  [">=1.0.0", "1.0.1"],
  [">=1.0.0", "1.1.0"],
  [">1.0.0", "1.0.1"],
  [">1.0.0", "1.1.0"],
  ["<=2.0.0", "2.0.0"],
  ["<=2.0.0", "1.9999.9999"],
  ["<=2.0.0", "0.2.9"],
  ["<2.0.0", "1.9999.9999"],
  ["<2.0.0", "0.2.9"]
].forEach(function (v) {
  assert.ok(satisfies(v[1], v[0]), v[0]+" satisfied by "+v[1]);
});
