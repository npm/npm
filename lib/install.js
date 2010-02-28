// npm install command

var npm = require("../npm"),
  utils = require("./utils"),
  rm = require("./utils/rm-rf"),
  exec = require("./utils/exec"),
  chain = require("./utils/chain"),
  log = utils.log,
  fail = utils.fail,
  succeed = utils.succeed,
  bind = utils.bind,
  fetch = require("./utils/fetch"),
  sys = require("sys"),
  fs = require("fs"),
  path = require("path"),
  semver = require("./utils/semver"),
  mkdir = require("./utils/mkdir-p");

module.exports = install;

// cb called with (er, ok) args.
function install (tarball, cb) {

  // fetch the tarball
  if (tarball.match(/^https?:\/\//)) {
    log("Fetch and then install: "+tarball);
    return fetchAndInstall(tarball, cb);
  }

  // install from a file.
  if (tarball.indexOf("file://") === 0) tarball = tarball.substr("file://".length);

  log("Install from: "+tarball);

  var ROOT = npm.root,
    npmdir = npm.dir,
    tmp = npm.tmp,
    unpackTargetDir = path.join(
      // todo: use a sha1 of the url, and don't fetch if it's there already
      tmp, path.basename(tarball, ".tgz")),
    unpackTargetTgz = path.join(
      unpackTargetDir, "package.tgz"),
    pkg = {};

  // at this point, presumably the filesystem knows how to open it.
  chain(
    [fs, "stat", tarball],
    [mkdir, unpackTargetDir],
    [unpackTar, tarball, unpackTargetDir],
    // clean up
    [function (cb) { log("unpacked, deleting"); cb() }],
    [fs, "unlink", tarball],

    // read the json
    [function (cb) {
      readJson(path.join(unpackTargetDir, "package.json"), function (er, ok) {
        if (er) return cb(er, ok);
        // save this just for this install
        pkg.data = ok;
        cb(null, ok);
      });
    }],

    // move to ROOT/.npm/{name}/{version}/package
    [function (cb) { log("about to move into place"); cb() }],
    [moveIntoPlace, unpackTargetDir, pkg],
    
    [function (cb) { log("about to resolve deps"); cb() }],
    // link deps into ROOT/.npm/{name}/{version}/dependencies
    // this is then added to require.paths, but ONLY for this package's main module.
    // of course, they could do require(".npm/foo/1.0.3/dependencies/bar") to import
    // whichever version of bar is currently satisfying foo-1.0.3's need.
    // For now, all dependencies must already be installed, or the install fails.
    [resolveDependencies, pkg],

    // generate ROOT/.npm/{name}/{version}/main.js
    [createMain, pkg],

    // symlink ROOT/{name}-{version}.js to ROOT/.npm/{name}/{version}/main.js
    [linkMain, pkg],

    // run the "make", if there is one.
    [runMake, pkg],

    // symlink ROOT/{name}-{version}/ to ROOT/.npm/{name}/{version}/{lib}
    [linkLib, pkg],

    // success!
    [function (cb) {
      log("Successfully installed "+pkg.data._npmKey);
      cb();
    }],

    cb
  );
};

// make sure that all the dependencies have been installed.
// todo: if they're not, then install them, and come back here.
function resolveDependencies (pkg, topCb) {
  log("Resolving dependencies");
  pkg = pkg && pkg.data;
  if (!pkg) return cb(new Error("Package not found to resolve dependencies"));
  // link foo-1.0.3 to ROOT/.npm/{pkg}/{ver}/dependencies/foo
  
  var found = [];
  chain(
    [mkdir, path.join(npm.dir, pkg.name, pkg.version, "dependencies")],
    [function (cb) {
      if (!pkg.dependencies) return topCb();
      // don't create anything until they're all verified.
      var reqs = [];
      for (var i in pkg.dependencies) reqs.push({name:i, ver:pkg.dependencies[i]});
      if (!reqs.length) return topCb();
      
      (function R (req) {
        if (!req) return cb();
        log(req.name+" "+req.ver, "required");
        // see if we have this thing installed.
        fs.readdir(path.join(npm.dir, req.name), function (er, versions) {
          if (er) return cb(new Error(
            "Required package: "+req.name+"("+req.ver+") not found."));
          // TODO: Get the "stable" version if there is one.
          // Look that up from the registry.
          versions.sort(semver.compare);
          var i = versions.length;
          while (i--) {
            if (semver.satisfies(versions[i], req.ver)) {
              found.push({name:req.name, ver:versions[i]});
              return R(reqs.pop());
            }
          }
          return cb(new Error(
            "Required package: "+req.name+"("+req.ver+") not found. "+
            "(Found: "+JSON.stringify(versions)+")"));
        });
      })(reqs.pop());
    }],
    [function (cb) {
      // link in all the found reqs.
      (function L (req) {
        if (!req) return cb();
        
        log(req.name+ "-" +req.ver, "found");
        
        // link ROOT/.npm/{pkg}/{ver}/dependencies/{req.name} to
        // ROOT/{req.name}-{req.version}
        // both the JS and the folder, if they're there
        // then try again with the next req.
        pkg.link = pkg.link || {};
        var to = path.join(npm.dir, pkg.name, pkg.version, "dependencies", req.name),
          linkDepTo = (req.name in pkg.link)
            ? path.join(npm.dir, pkg.name, pkg.version, "package", pkg.link[req.name])
            : null,
          from = path.join(npm.root, req.name + "-" + req.ver);
        function link (cb) {
          fs.stat(from, function (er, stat) {
            if (er) return cb();
            exec("ln", ["-s", from, to], function (er) {
              if (er) return cb(er);
              if (linkDepTo) {
                mkdir(path.dirname(linkDepTo), function (er) {
                  if (er) return cb(er);
                  exec("ln", ["-s", from, linkDepTo], cb);
                });
              }
              else cb();
            });
          });
        };
        
        chain([link], [function (cb) {
          from += ".js";
          to += ".js";
          if (linkDepTo) linkDepTo += ".js";
          cb();
        }], [link],
        function (er) { if (er) return topCb(er); L(found.pop()) });
      })(found.pop());
    }],
    topCb
  );
}

// move to ROOT/.npm/{name}/{version}/package
function moveIntoPlace (dir, pkg, cb) {
  pkg = pkg.data;
  if (!pkg.name || !pkg.version) {
    return cb(new Error("Name or version not found in package info."));
  }
  var target = path.join(npm.dir, pkg.name, pkg.version);

  chain(
    [function (cb) {
      path.exists(target, function (e) {
        log(target + " ", (e?"remove":"creating"));
        if (e) rm(target, function (er, ok) {
          if (er) {
            log(target, "could not remove!");
            cb(new Error(target+" exists, and can't be removed"));
          } else {
            log(target,"unlinked");
            cb();
          };
        });
        else cb();
      });
    }],
    [mkdir, target],
    [function (cb) { pkg._npmPackage = target = path.join(target, "package"); cb() }],
    [function (cb) { fs.rename(dir, target, cb) }],
    [function (cb) { log("moved into place"); cb() }],
    cb
  );
};

function fetchAndInstall (tarball, cb) {
  log("fetchAndInstall: "+tarball);
  mkdir(npm.tmp, function (er, ok) {
    if (er) return cb(er, ok);
    var target = path.join(npm.tmp, tarball.replace(/[^a-zA-Z0-9]/g, "-")+"-"+
                           Date.now()+"-"+Math.random()+".tgz");

    fetch(tarball, target, function (er, ok) {
      if (er) return cb(er, ok);
      log("fetched, installing for reals now from "+target);
      install(target, cb);
    });
  });
};


// FIXME: not sure why this needs a timeout, but it's like it's trying
// to read the file in some cases before it's done writing, and then
// tar flips out.
function unpackTar (tarball, unpackTarget, cb) {
  setTimeout(function () {
    exec("tar", ["xzvf", tarball, "--strip", "1", "-C", unpackTarget], cb);
  }, 100);
};

function readJson (jsonFile, cb) {
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
    // 0.1.2-L24561-2010-02-25-13-41-32-903 for test/link packages.
    if (!(/([0-9]+\.){2}([0-9]+)(-[a-zA-Z0-9\.-]+)?/.exec(json.version))) {
      return cb(new Error("Invalid version: "+json.version));
    }
    var key = json.name+"-"+json.version;
    json._npmKey = key;
    npm.set(key, json);
    cb(null, json);
  });
};

function createMain (pkg,cb) {
  pkg = pkg.data;
  if (!pkg.main) return cb();

  var code =
      "// generated by npm, please don't touch!\n"+
      "require.paths.unshift("+
        JSON.stringify(path.join(npm.dir, pkg.name, pkg.version, "dependencies"))+
      ");"+
      "module.exports = require("+
        JSON.stringify(path.join(npm.dir, pkg.name, pkg.version, "package", pkg.main)) +
      ");"+
      "require.paths.shift();"+
      "\n",
    proxyFile = path.join(npm.dir, pkg.name, pkg.version, "main.js");

  fs.writeFile(proxyFile, code, "ascii", cb);
};

// symlink ROOT/{name}-{version}/ to ROOT/.npm/{name}/{version}/{lib}
function linkLib (pkg, cb) {
  pkg = pkg.data;
  var lib = pkg.directories && pkg.directories.lib || pkg.lib || false;
    defLib = (lib === false);
  if (defLib) lib = "lib";

  var from = path.join(npm.dir, pkg.name, pkg.version, "package", lib),
    toInternal = path.join(npm.dir, pkg.name, pkg.version, "lib"),
    to = path.join(npm.root, pkg.name+"-"+pkg.version);

  function doLink (er) {
    if (er) return cb(er);
    exec("ln", ["-s", from, toInternal], function (er) {
      if (er) return cb(er);
      exec("ln", ["-s", toInternal, to], cb);
    });
  }

  fs.stat(from, function (er, s) {
    if (er) return (!defLib) ? cb(new Error("Libs dir not found "+from)) : cb();
    if (!s.isDirectory()) {
      if (!defLib) cb(new Error("Libs dir not a dir: "+lib));
      else cb();
    } else {
      // make sure that it doesn't already exist.  If so, rm it.
      fs.stat(to, function (er, s) {
        if (!er) fs.unlink(to, doLink);
        else doLink();
      })
    }
  });
};

function linkMain (pkg, cb) {
  pkg = pkg.data;
  if (!pkg.main) return;
  var
    from = path.join(npm.dir, pkg.name, pkg.version, "main.js"),
    to = path.join(npm.root, pkg.name+"-"+pkg.version+".js");
  path.exists(to, function (e) {
    if (e) cb();
    else exec("ln", ["-s", from, to], cb);
  });
};

function runMake (pkg, cb) {
  pkg = pkg.data;
  if (!pkg.make) return cb();
  log("runMake: "+pkg.make+" (wd: "+pkg._npmPackage+")");
  process.chdir(pkg._npmPackage);
  sys.exec(pkg.make, function (er, ok, stderr) {
    if (er) cb(er, ok, stderr);
    else cb(null, ok, stderr);
  });
};
