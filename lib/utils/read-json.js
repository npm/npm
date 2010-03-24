
module.exports = readJson;

var fs = require("fs"),
  semver = require("./semver"),
  log = require("../utils/log");

function readJson (jsonFile, cb) {
  log(jsonFile, "readJson");
  fs.readFile(jsonFile, function (er, jsonString) {
    if (er) return cb(er, jsonString);
    var json;
    try {
      json = JSON.parse(jsonString);
    } catch (ex) {
      return cb(new Error(
        "Failed to parse json file: "+jsonFile+"\n"+ex.message+"\n"+jsonString));
    }

    ["env", "context", "ctx", "vnd", "vendor"].forEach(function (ctx) {
      if ((vnd in json) && json[vnd]) {
        ["node", "npm"].forEach(function (k) {
          if ((k in json[vnd]) && json[vnd][k]) {
            for (var i in json[vnd][k]) {
              json[i] = json[vnd][k][i];
            }
          }
        });
      }
    });

    json.name = json.name.replace(/([^\w-]|_)+/g, '-');
    // allow semvers, but also stuff like
    // 0.1.2beta-L24561-2010-02-25-13-41-32-903 for test/link packages.
    if (!(semver.valid(json.version))) {
      return cb(new Error("Invalid version: "+json.version));
    }

    var key = json.name+"-"+json.version;
    json._id = key;
    testEngine(json, cb);
  });
}

function testEngine (json, cb) {
  if (!json.engines) return cb(null, json);

  var nodeVer = process.version,
    ok = false;
  if (Array.isArray(json.engines)) {
    // Packages/1.0 commonjs style, with an array.
    // hack it to just hang a "node" member with the version range,
    // then do the npm-style check below.
    for (var i = 0, l = json.engines.length; i < l; i ++) {
      var e = json.engines[i].trim();
      if (e.substr(0, 4) === "node") {
        json.engines.node = e.substr(4);
        break;
      }
    }
  }
  log("required: node " + JSON.stringify(json.engines.node), "testEngine");
  if (!("node" in json.engines)) nodeNotSupported(cb);
  else if (!semver.satisfies(nodeVer, json.engines.node)) {
    nodeUnsatisfied(nodeVer, json.engines.node, cb);
  }
  else cb(null, json);
}

function nodeNotSupported (cb) { cb(new Error("node not supported")) }
function nodeUnsatisfied (nodeVer, e, cb) {
  cb(new Error("node version not compatible: \n"+
    "required: " +e+"\nactual: " +nodeVer));
}
