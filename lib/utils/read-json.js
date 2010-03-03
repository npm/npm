
module.exports = readJson;

var fs = require("fs"),
  semver = require("./semver"),
  log = require("../utils").log;

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
    json.name = json.name.replace(/([^\w-]|_)+/g, '-');
    // allow semvers, but also stuff like
    // 0.1.2beta-L24561-2010-02-25-13-41-32-903 for test/link packages.
    if (!(semver.valid(json.version))) {
      return cb(new Error("Invalid version: "+json.version));
    }
    var key = json.name+"-"+json.version;
    json._npmKey = key;
    cb(null, json);
  });
};
