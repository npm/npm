
// utilities for working with the js-registry site.

exports.publish = publish;
exports.tag = tag;

var npm = require("../../npm"),
  http = require("http"),
  url = require("url"),
  log = require("./log"),
  sys = require("sys");

function tag (project, version, tag, cb) { PUT(project+"/"+tag, version, cb) }

function publish (data, tarball, cb) {
  // add the dist-url to the data, pointing at the tarball.
  // if the {name} isn't there, then create it.
  // if the {version} is already there, then fail.
  // then:
  // PUT the data to {npm.config.registry}/{data.name}/{data.version}
  reg();
  var fullData =
    { "_id" : data.name
    , "name" : data.name
    , "description" : data.description
    , "dist-tags" : {}
    , "versions" : {}
    };
  fullData.versions[ data.version ] = data;
  data._id = data.name+"-"+data.version;
  data.dist = { "tarball" : tarball };

  // first try to just PUT the whole fullData, and this will fail if it's
  // already there, because it'll be lacking a _rev, so couch'll bounce it.
  PUT(data.name, fullData, function (er) {
    if (!er) return cb();
    // there was an error, so assume the fullData is already there.
    // now try to create just this version.  This time, failure
    // is not ok.
    // Note: the first might've failed for a down host or something,
    // in which case this will likely fail, too.  If the host was down for the
    // first req, but now it's up, then this may fail for not having the
    // project created yet, or because the user doesn't have access to it.
    PUT(data.name+"/"+data.version, data, function (er) {
      if (er) return cb(er);
      cb();
    });
  });
}

function PUT (where, what, cb) {
  reg();
  what = JSON.stringify(what);
  log(where, "registryPUT");
  where = npm.config.registry + where;

  var u = url.parse(where),
    headers = { "content-type" : "application/json"
              , "host" : u.host
              },
    client = http.createClient(u.port || (u.protocol === "https:" ? 443 : 80), u.hostname),
    request = client.request("PUT", u.pathname, headers);

  log(sys.inspect(headers), "registryPUT headers");

  request.addListener("response", function (response) {
    // if (response.statusCode !== 200) return cb(new Error(
    //   "Status code " + response.statusCode + " from PUT "+where));
    var data = "";
    response.setBodyEncoding("utf8");
    response.addListener("data", function (chunk) { data += chunk });
    response.addListener("end", function () {
      log(data, "registryPUT");
      try {
        data = JSON.parse(data);
      } catch (ex) {
        ex.message += "\n" + data;
        return cb(ex);
      }
      if (data.error) return cb(new Error(
        data.error + (" "+data.reason || "")));
      cb(null, data);
    });
  });
  request.write(what, "utf8");
  request.close();
}

function reg () {
  if (!npm.config.registry) return cb(new Error(
    "Must define registry before publishing."));
  log(npm.config.registry, "registry");
  if (npm.config.registry.substr(-1) !== "/") {
    npm.config.registry += "/";
  }
}
