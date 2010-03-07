
// npm build command

// everything about the installation after the creation of
// the .npm/{name}/{version}/package folder.
// linking the main.js and libs folder, dropping these into
// the npm.root, resolving dependencies, etc.

// This runs AFTER install or link are completed.

var npm = require("../npm"),
  log = require("./utils/log"),
  rm = require("./utils/rm-rf"),
  chain = require("./utils/chain"),
  fetch = require("./utils/fetch"),
  fs = require("fs"),
  path = require("path"),
  semver = require("./utils/semver"),
  mkdir = require("./utils/mkdir-p"),
  lifecycle = require("./utils/lifecycle"),
  readJson = require("./utils/read-json");

module.exports = build;

// pkg is either a "package" folder, or a package.json data obj, or an
// object that has the package.json data on the _data member.
function build (pkg, cb) {

  // if pkg isn't an object, then parse the package.json inside it, and build with that.
  if (typeof pkg === "string") {
    return readAndBuild(pkg, cb);
  }

  pkg = pkg && pkg._data || pkg;

  if (!pkg) return cb(new Error(
    "Invalid package data"));

  var ROOT = npm.root,
    npmdir = npm.dir;

  // at this point, presumably the filesystem knows how to open it.
  chain(
    [lifecycle, pkg, "preinstall"],
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

    // symlink ROOT/{name}-{version}/ to ROOT/.npm/{name}/{version}/{lib}
    [linkLib, pkg],

    // symlink any bins into the node install prefix
    [linkBins, pkg],

    // run the "install" lifecycle script
    [lifecycle, pkg, "install"],
    [lifecycle, pkg, "postinstall"],

    // success!
    function (cb) {
      log("Success: "+pkg._npmKey, "build");
      cb();
    },

    cb
  );
}

function readAndBuild (folder, cb) {
  log("readAndBuild", "build");
  readJson(path.join(folder, "package.json"), function (er, data) {
    if (er) cb(er);
    else build(data, cb);
  });
}

// make sure that all the dependencies have been installed.
// todo: if they're not, then install them, and come back here.
function resolveDependencies (pkg, topCb) {
  log("starting...", "resolveDependencies");
  if (!pkg) return cb(new Error("Package not found to resolve dependencies"));
  // link foo-1.0.3 to ROOT/.npm/{pkg}/{version}/dependencies/foo

  var found = [];
  chain(
    [mkdir, path.join(npm.dir, pkg.name, pkg.version, "dependencies")],
    function (cb) {
      if (!pkg.dependencies) return topCb();
      // don't create anything until they're all verified.
      var reqs = [];
      for (var i in pkg.dependencies) reqs.push({name:i, version:pkg.dependencies[i]});
      if (!reqs.length) return topCb();

      (function R (req) {
        if (!req) return cb();
        log(req.name+" "+req.version, "required");
        // see if we have this thing installed.
        fs.readdir(path.join(npm.dir, req.name), function (er, versions) {
          if (er) return cb(new Error(
            "Required package: "+req.name+"("+req.version+") not found."));
          // TODO: Get the "stable" version if there is one.
          // Look that up from the registry.
          versions.sort(semver.compare);
          var i = versions.length;
          while (i--) {
            if (semver.satisfies(versions[i], req.version)) {
              found.push({name:req.name, version:versions[i]});
              return R(reqs.pop());
            }
          }
          return cb(new Error(
            "Required package: "+req.name+"("+req.version+") not found. "+
            "(Found: "+JSON.stringify(versions)+")"));
        });
      })(reqs.pop());
    },
    // for all the found ones, make a note that this package depends on it
    // this is important for safe uninstallation
    function (cb) {
      var deps = found.slice(0);
      (function L (dep) {
        if (!dep) return cb();
        // link from ROOT/.npm/{dep.name}/{dep.version}/dependents/{pkg}-{version}
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
    },
    function (cb) {
      // link in all the found reqs.
      (function L (req) {
        if (!req) return cb();

        log(req.name+ "-" +req.version, "found");

        // link ROOT/.npm/{pkg}/{version}/dependencies/{req.name} to
        // ROOT/{req.name}-{req.version}
        // both the JS and the folder, if they're there
        // then try again with the next req.
        pkg.link = pkg.link || {};
        var to = path.join(npm.dir, pkg.name, pkg.version, "dependencies", req.name),
          linkDepTo = (req.name in pkg.link)
            ? path.join(npm.dir, pkg.name, pkg.version, "package", pkg.link[req.name])
            : null,
          from = path.join(npm.root, req.name + "-" + req.version);
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
        }

        chain(link, function (cb) {
          from += ".js";
          to += ".js";
          if (linkDepTo) linkDepTo += ".js";
          cb();
        }, link,
        function (er) { if (er) return topCb(er); L(found.pop()) });
      })(found.pop());
    },
    topCb
  );
}

function writeShim (from, to, dep, cb) {
  if (!cb) {
    cb = dep;
    dep = false;
  }
  log("from: "+from, "writeShim");
  log("to: "+to, "writeShim");
  var code = "#!"+process.installPrefix+"/bin/node\n"+
    "// generated by npm, please don't touch!\n"+
    (dep ? "require.paths.unshift(" + JSON.stringify(dep) + ");" : "") +
    "module.exports = require(" + JSON.stringify(from.replace(/\.(js|node)$/, '')) + ");" +
    (dep ? "require.paths.shift();" : "") + "\n";
  fs.writeFile(to, code, "ascii", function (er, ok) {
    if (er) return cb(er);
    fs.chmod(to, 0755, cb);
  });
}

function createMain (pkg,cb) {
  if (!pkg.main) return cb();
  log(pkg.main, "createMain");
  writeShim(
    path.join(npm.dir, pkg.name, pkg.version, "package", pkg.main),
    path.join(npm.dir, pkg.name, pkg.version, "main.js"),
    path.join(npm.dir, pkg.name, pkg.version, "dependencies"),
    cb
  );
}

// symlink ROOT/{name}-{version}/ to ROOT/.npm/{name}/{version}/{lib}
function linkLib (pkg, cb) {
  var lib = pkg.directories && pkg.directories.lib || pkg.lib || false;
    defLib = (lib === false);
  if (defLib) lib = "lib";

  var from = path.join(npm.dir, pkg.name, pkg.version, "package", lib),
    toInternal = path.join(npm.dir, pkg.name, pkg.version, "lib"),
    to = path.join(npm.root, pkg.name+"-"+pkg.version);

  function doLink (er) {
    if (er) return cb(er);
    chain(
      [rm, toInternal],
      [rm, to],
      function (cb) { fs.symlink(from, toInternal, function (er) {
        if (er) return cb(er);
        fs.symlink(toInternal, to, cb);
      })},
      cb
    );
  }

  fs.stat(from, function (er, s) {
    if (er) return (!defLib) ? cb(new Error("Libs dir not found "+from)) : cb();
    if (!s.isDirectory()) {
      if (!defLib) cb(new Error("Libs dir not a dir: "+lib));
      else cb();
    } else {
      // make sure that it doesn't already exist.  If so, rm it.
      fs.lstat(to, function (er, s) {
        if (!er) {
          fs.unlink(to, doLink);
        } else doLink();
      });
    }
  });
}

function linkMain (pkg, cb) {
  if (!pkg.main) return cb();
  var from = path.join(npm.dir, pkg.name, pkg.version, "main.js"),
    to = path.join(npm.root, pkg.name+"-"+pkg.version+".js");
  fs.lstat(to, function (er) {
    if (!er) rm(to, function (er) {
      if (er) cb(er);
      else linkMain(pkg, cb);
    });
    else fs.symlink(from, to, cb);
  });
}

function linkBins (pkg, cb) {
  if (!pkg.bin) return cb();
  var steps = [],
    dep = path.join(npm.dir, pkg.name, pkg.version, "dependencies");
  for (var i in pkg.bin) {
    var to = path.join(process.installPrefix, "bin", i+"-"+pkg.version),
      from = path.join(npm.dir, pkg.name, pkg.version, "package", pkg.bin[i]);
    steps.push([shimTest, from, to, dep]);
  }
  steps.push(cb);
  chain(steps);
}

function shimTest (from, to, dep, cb) {
  // if it needs a shim, then call writeShim
  // otherwise, just link it in.
  if (/\.(node|js)$/(from)) return writeShim(from, to, dep, cb);
  fs.readFile(from, function (er, data) {
    if (er) return cb(er);
    var envNode = /#!(\/usr\/bin\/)?env node/(from),
      node = /#!(\/usr(\/local)?\/bin\/)?node/(from);
    if (envNode && envNode.index === 0 || node && node.index === 0) {
      return writeShim(from, to, dep, cb);
    }
    return link(from, to, cb);
  });
}

function link (from, to, cb) {
  chain(
    [fs, "stat", from],
    [rm, to],
    [fs, "symlink", from, to],
    cb
  );
}
