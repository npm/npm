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
  mkdir = require("./utils/mkdir-p"),
  lifecycle = require("./utils/lifecycle"),
  readJson = require("./utils/read-json");

module.exports = install;

// cb called with (er, ok) args.
function install (tarball, cb) {

  // fetch the tarball
  if (tarball.match(/^https?:\/\//)) {
    log(tarball, "install");
    return fetchAndInstall(tarball, cb);
  }

  // install from a file.
  if (tarball.indexOf("file://") === 0) tarball = tarball.substr("file://".length);

  log(tarball, "install");

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

    // read the json and then save it
    [function (cb) {
      readJson(path.join(unpackTargetDir, "package.json"), function (er, data) {
        if (er) return cb(er, data);
        // save this just for this install
        npm.set(data._npmKey, data);
        pkg.data = data;
        cb(null, data);
      });
    }],

    // move to ROOT/.npm/{name}/{version}/package
    [moveIntoPlace, unpackTargetDir, pkg],

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
    // [runMake, pkg],
    
    // run the "install" lifecycle script
    [lifecycle, pkg, "install"],

    // symlink ROOT/{name}-{version}/ to ROOT/.npm/{name}/{version}/{lib}
    [linkLib, pkg],

    // success!
    [function (cb) {
      log("Successfully installed "+pkg.data._npmKey, "WIN!");
      cb();
    }],

    cb
  );
};

// make sure that all the dependencies have been installed.
// todo: if they're not, then install them, and come back here.
function resolveDependencies (pkg, topCb) {
  log("starting...", "resolveDependencies");
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
    // for all the found ones, make a note that this package depends on it
    // this is important for safe uninstallation
    [function (cb) {
      var deps = found.slice(0);
      (function L (dep) {
        if (!dep) return cb();
        // link from ROOT/.npm/{dep.name}/{dep.version}/dependents/{pkg}-{ver}
        // to the package folder being installed.
        var dependents = path.join(npm.dir, dep.name, dep.version, "dependents"),
          to = path.join(dependents, pkg.name + "-" + pkg.version),
          from = path.join(npm.dir, pkg.name, pkg.version);
        chain(
          [mkdir, dependents],
          [rm, to], // should be rare
          [fs, "symlink", from, to],
          cb
        );
      })(deps.pop());
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
            fs.symlink(from, to, function (er) {
              if (er) return cb(er);
              if (linkDepTo) {
                mkdir(path.dirname(linkDepTo), function (er) {
                  if (er) return cb(er);
                  fs.symlink(from, linkDepTo, cb);
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

  log("to: "+pkg.name+"-"+pkg.version+" from: "+dir, "moveIntoPlace");
  chain(
    [function (cb) {
      path.exists(target, function (e) {
        log((e?"remove":"creating") + " " +target, "moveIntoPlace");
        if (e) rm(target, function (er, ok) {
          if (er) {
            log("could not remove " + target, "moveIntoPlace");
            cb(new Error(target+" exists, and can't be removed"));
          } else {
            log("unlinked "+target,"moveIntoPlace");
            cb();
          };
        });
        else cb();
      });
    }],
    [mkdir, target],
    [function (cb) { pkg._npmPackage = target = path.join(target, "package"); cb() }],
    [function (cb) { fs.rename(dir, target, cb) }],
    [function (cb) { log("done", "moveIntoPlace"); cb() }],
    cb
  );
};

function fetchAndInstall (tarball, cb) {
  mkdir(npm.tmp, function (er, ok) {
    if (er) return cb(er, ok);
    var target = path.join(npm.tmp, tarball.replace(/[^a-zA-Z0-9]/g, "-")+"-"+
                           Date.now()+"-"+Math.random()+".tgz");

    fetch(tarball, target, function (er, ok) {
      if (er) return cb(er, ok);
      chain(
        [install, target],
        // clean up
        [function (cb) { log(target, "deleting"); cb() }],
        [fs, "unlink", target],
        cb
      );
    });
  });
};


function unpackTar (tarball, unpackTarget, cb) {
  exec("tar", ["xzvf", tarball, "--strip", "1", "-C", unpackTarget], cb);
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

  log("from: "+from, "linkLib");
  log("to: "+to, "linkLib");

  function doLink (er) {
    if (er) return cb(er);
    fs.symlink(from, toInternal, function (er) {
      if (er) return cb(er);
      fs.symlink(toInternal, to, cb);
    });
  }

  fs.stat(from, function (er, s) {
    if (er) return (!defLib) ? cb(new Error("Libs dir not found "+from)) : cb();
    if (!s.isDirectory()) {
      if (!defLib) cb(new Error("Libs dir not a dir: "+lib));
      else cb();
    } else {
      // make sure that it doesn't already exist.  If so, rm it.
      fs.lstat(to, function (er, s) {
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
    else fs.symlink(from, to, cb);
  });
};

function runMake (pkg, cb) {
  pkg = pkg.data;
  if (!pkg.make) return cb();
  log(pkg.make+" (wd: "+pkg._npmPackage+")", "runMake");
  process.chdir(pkg._npmPackage);
  sys.exec(pkg.make, function (er, ok, stderr) {
    if (er) cb(er, ok, stderr);
    else {
      ok && log(ok, "runMake");
      stderr && log(stderr, "runMake");
      cb(null, ok, stderr);
    }
  });
};
