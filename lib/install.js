// npm install command

var npm = require("../npm"),
  utils = require("./utils"),
  log = utils.log,
  method = utils.method,
  fail = utils.fail,
  succeed = utils.succeed,
  bind = utils.bind,
  queue = require("./utils/queue").queue,
  fetch = require("./utils/fetch"),
  copy = require("./utils/copy"),
  sys = require("sys"),
  fs = require("fs"),
  path = require("path"),
  Promise = require("events").Promise;

module.exports = install;

function install (tarball) {
  var p = new Promise;
  
  // fetch the tarball
  if (tarball.match(/^https?:\/\//)) {
    return fetchAndInstall(tarball)
      .addCallback(succeed(p))
      .addErrback(fail(p, "Failed install "+tarball));
  }
  // install from a file.
  if (tarball.indexOf("file://") === 0) tarball = tarball.substr("file://".length);

  // don't do activation or dependencies yet.  just install in such a way
  // that these things are *possible*.

  var ROOT = npm.root,
    npmdir = npm.dir,
    tmp = npm.tmp,
    unpackTargetDir = path.join(
      // todo: use a sha1 of the url, and don't fetch if it's there already
      tmp, path.basename(tarball, ".tgz")),
    unpackTargetTgz = path.join(
      unpackTargetDir, "package.tgz"),
    pkg = {};

  // at this point, just trust that the filesystem knows how to open it.
  fs.stat(tarball)
    .addErrback(fail(p, "tarball not found: "+tarball))
    .addCallback(function () {
      queue([
        // unpack to ROOT/.npm/.tmp/{randomy stuff}
        // make the directory
        ensureDir(unpackTargetDir, 0755),

        // unpack
        unpackTar(tarball, unpackTargetDir),
        // clean up
        method(fs, "unlink", tarball),

        // read the json
        readJson(path.join(unpackTargetDir, "package.json")),

        // save this just for this install
        function (data) { pkg.data = data },

        // move to ROOT/.npm/{name}/{version}/package
        moveIntoPlace(unpackTargetDir, pkg),

        // generate ROOT/.npm/{name}/{version}/main.js
        createMain(pkg),
        
        // symlink ROOT/{name}-{version}.js to ROOT/.npm/{name}/{version}/main.js
        linkMain(pkg),

        // run the "make", if there is one.
        runMake(pkg),

        // symlink ROOT/{name}-{version}/ to ROOT/.npm/{name}/{version}/{lib}
        linkLib(pkg),

        // success!
        function () {
          utils.log("Successfully installed "+pkg.data._npmKey);
        }
      ], function (f, k, lastResult) { log(k + " " + f.name, "npm-install"); return f(lastResult) })
        .addCallback(function () {
          p.emitSuccess("successfully installed "+pkg.data._npmKey)
        })
        .addErrback(fail(p));
    });
  return p;
};

// move to ROOT/.npm/{name}/{version}/package
function moveIntoPlace (dir, pkg) { return function moveIntoPlace () {
  var p = new Promise;
  pkg = pkg.data;
  if (!pkg.name || !pkg.version) {
    process.nextTick(fail(p, "Name or version not found in package info."));
    return p;
  }
  var target = path.join(npm.dir, pkg.name, pkg.version);
  
  return queue([
    function () {
      var p = new Promise;
      path.exists(target, function (e) {
        log(target + " " + (e?"exists":"doesn't exist"));
        if (e) fs.rmdir(target)
          .addCallback(function () {
            log(target+" successfully unlinked");
            p.emitSuccess();
          })
          .addErrback(function () {
            log("couldn't remove "+target);
            p.emitError(target+" exists, and can't be removed");
          });
        else p.emitSuccess();
      });
      return p;
    },
    ensureDir(target),
    function () { pkg._npmPackage = target = path.join(target, "package") },
    function () { return fs.rename(dir, target) },
    function () { log("moved into place") },
  ], function (f) { return f() });
}};

function fetchAndInstall (tarball) {
  var p = new Promise;
  log("Fetch: "+tarball);
  ensureDir(npm.tmp, 0755)()
    .addCallback(function () {
      var target = path.join(npm.tmp, tarball.replace(/[^a-zA-Z0-9]/g, "-")+"-"+
                             Date.now()+"-"+Math.random()+".tgz");
      fetch(tarball, target)
        .addErrback(fail(p, "Could not fetch "+tarball+" to "+target))
        .addCallback(function () {
          install(target)
            .addCallback(succeed(p))
            .addErrback(fail(p, "Failed fetch install "+tarball));
        });
    })
    .addErrback(fail(p, "Could not create: "+npm.tmp));
  return p;
};

function ensureDir (dir, chmod) { return function ensureDir () {
  var dirs = dir.split("/"),
    walker = [];
  chmod = chmod || 0755;
  walker.push(dirs.shift());
  return queue(dirs, function (d) {
    var p = new Promise;
    walker.push(d);
    var dir = walker.join("/");
    fs.stat(dir)
      .addErrback(function () {
        fs.mkdir(dir, chmod)
          .addCallback(succeed(p))
          .addErrback(fail(p, "Failed to mkdir ["+walker.join("/")+"]"));
      })
      .addCallback(function (s) {
        if (s.isDirectory()) p.emitSuccess();
        else p.emitError("Failed to mkdir "+dir+": File exists");
      });
    return p;
  });
}};

function unpackTar (tarball, unpackTarget) { return function unpackTar () {
  utils.log("unpack "+tarball);
  return processPromise("tar", ["xzvf", tarball, "--strip", "1", "-C", unpackTarget]);
}};

function readJson (jsonFile) { return function readJson () {
  var p = new Promise;
  fs.readFile(jsonFile)
    .addErrback(fail(p, "Could not read "+jsonFile))
    .addCallback(function (jsonString) {
      var json;
      try {
        json = JSON.parse(jsonString);
      } catch (ex) {
        p.emitError("Failed to parse json\n"+ex.message+"\n"+jsonString);
      }
      json.name = json.name.replace(/([^\w-]|_)+/g, '-');
      // allow semvers, but also stuff like
      // 0.1.2-L24561-2010-02-25-13-41-32-903 for test/link packages.
      if (!(/([0-9]+\.){2}([0-9]+)(-[a-zA-Z0-9\.-]+)?/.exec(json.version))) {
        p.emitFailure("Invalid version: "+json.version);
        return p;
      }
      var key = json.name+"-"+json.version;
      json._npmKey = key;
      npm.set(key, json);
      p.emitSuccess(json);
    });
  return p;
}};

function createMain (pkg) { return function createMain () {
  pkg = pkg.data;
  if (!pkg.main) return;
  var p = new Promise,
    code =
      "// generated by npm, please don't touch!\n"+
      "module.exports=require("+
        JSON.stringify(path.join(npm.dir, pkg.name, pkg.version, "package", pkg.main)) +
      ");\n",
    proxyFile = path.join(npm.dir, pkg.name, pkg.version, "main.js");
  fs.open(proxyFile,
      process.O_CREAT | process.O_EXCL | process.O_WRONLY, 0755)
    .addErrback(fail(p, "Could not open "+proxyFile))
    .addCallback(function (fd) {
      fs.write(fd, code, "ascii")
        .addErrback(fail(p, "Could not write to "+proxyFile))
        .addCallback(succeed(p));
    });
  return p;
}};

// symlink ROOT/{name}-{version}/ to ROOT/.npm/{name}/{version}/{lib}
function linkLib (pkg) { return function linkLib () {
  pkg = pkg.data;
  var lib = pkg.directories && pkg.directories.lib || pkg.lib || false;
    defLib = (lib === false);
  if (defLib) lib = "lib";

  var from = path.join(npm.dir, pkg.name, pkg.version, "package", lib),
    to = path.join(npm.root, pkg.name+"-"+pkg.version);
  
  var p = new Promise;
  fs.stat(from)
    .addErrback(function () {
      if (!defLib) p.emitError("Libs dir not found "+from);
      else p.emitSuccess(); // no worries, just move on.
    })
    .addCallback(function (s) {
      if (!s.isDirectory()) p.emitFailure("Libs dir not a dir");
      else processPromise("ln", ["-s", from, to])
        .addCallback(succeed(p))
        .addErrback(fail(p, "Failed to link libs folder"));
    });
  return p;
}};

function linkMain (pkg) { return function linkMain () {
  pkg = pkg.data;
  if (!pkg.main) return;
  var
    from = path.join(npm.dir, pkg.name, pkg.version, "main.js"),
    to = path.join(npm.root, pkg.name+"-"+pkg.version+".js");
  var p = new Promise;
  path.exists(to, function (e) {
    if (e) p.emitSuccess();
    else processPromise("ln", ["-s", from, to])
      .addCallback(succeed(p))
      .addErrback(fail(p, "Failed to ln -s "+from+" "+to));
  });
  return p;
}};

function runMake (pkg) { return function runMake () {
  pkg = pkg.data;
  if (!pkg.make) return;
  var p = new Promise;
  process.chdir(pkg._npmPackage);
  sys.exec(pkg.make)
    .addErrback(fail(p, "Failed to run make command: "+pkg.make))
    .addCallback(succeed(p));
  return p;
}};

function processPromise (cmd, args) {
  var p = new Promise;
  process.createChildProcess(cmd, args)
    .addListener("error", function (chunk) {
      if (chunk) process.stdio.writeError(chunk)
    })
    .addListener("output", function (chunk) {
      if (chunk) process.stdio.write(chunk)
    })
    .addListener("exit", function (code) {
      p[code ? "emitError" : "emitSuccess"](code);
    });
  return p;
};
