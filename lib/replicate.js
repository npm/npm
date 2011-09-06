module.exports = replicate;

replicate.usage = "npm replicate <tarball file>" + //
"\nnpm replicate <tarball url>" + //
"\nnpm replicate <folder>" + //
"\nnpm replicate <pkg>" + //
"\nnpm replicate <pkg>@<tag>" + //
"\nnpm replicate <pkg>@<version>" + //
"\nnpm replicate <pkg>@<version range>" + //
"\n\nCan specify one or more: npm replicate ./foo.tgz bar@stable /some/folder" + //
"\nReplicates dependencies in ./package.json if no argument supplied";

var npm = require("../npm.js");
var semver = require("semver");
var readJson = require("./utils/read-json.js");
var log = require("./utils/log.js");
var path = require("path");
var fs = require("graceful-fs");
var cache = require("./cache.js");
var asyncMap = require("slide").asyncMap;
var chain = require("slide").chain;
var url = require("url");
var relativize = require("./utils/relativize.js");

function replicate(args, cb) {
	var where = npm.prefix;
	if (npm.config.get("global")) {
		where = path.resolve(where, "lib");
	}
	readJson(path.resolve(where, "package.json"), function (er, data) {
		if (er) {
			data = null;
		}
		var family = {};
		var ancestors = {};
		if (data) {
			family[data.name] = ancestors[data.name] = data.version;
		}
		var from = {
			url: "https://registry.npmjs.org/",
			auth: null,
			email: null,
			authRequired: false
		};
		var to = {
			url: npm.config.get("registry"),
			auth: npm.config.get("_auth"),
			email: npm.config.get("email"),
			authRequired: npm.config.get("always-auth")
		};
		npm.config.set("registry", from.url);
		npm.config.del("_auth");
		npm.config.del("email");
		replicateMany(from, to, args, where, family, ancestors, true, function (err) {
			npm.config.set("registry", to.url);
			npm.config.set("_auth", to.auth);
			npm.config.set("email", to.email);
			cb(err);
		});
	});
}

function replicateMany(fromRegistry, toRegistry, what, where, family, ancestors, explicit, cb) {

	var deps = [];

	function done() {
		if (deps.length === 0) {
			cb();
		} else {
			var next = [deps.pop()];
			console.info("processing " + next[0]);
			replicateMany(fromRegistry, toRegistry, next, where, family, ancestors, explicit, done);
		}
	}

	// 'npm replicate foo' should install the version of foo
	// that satisfies the dep in the current folder.
	// This will typically return immediately, since we already read
	// this file family, and it'll be cached.
	readJson(path.resolve(where, "package.json"), function (er, data) {
		if (er) {
			data = {};
		}

		d = data.dependencies || {};
		var parent = data._id;

		// what is a list of things.
		// resolve each one.
		asyncMap(what, targetResolver(fromRegistry, toRegistry, where, family, ancestors, explicit, d), function (er, targets) {
			if (er) {
				return cb(er);
			}

			// each target will be a data object corresponding
			// to a package, folder, or whatever that is in the cache now.
			var newPrev = Object.create(family);
			var newAnc = Object.create(ancestors);

			newAnc[data.name] = data.version;
			targets.forEach(function (t) {
				newPrev[t.name] = t.version;
			});
			log.silly(targets, "resolved");
			targets.filter(function (t) {
				return t;
			});
			asyncMap(targets, function (target, cb) {
				var key;
				for (key in target.dependencies) {
					if (target.dependencies.hasOwnProperty(key)) {
						deps.push(key + "@" + target.dependencies[key]);
					}
				}
				for (key in target.devDependencies) {
					if (target.devDependencies.hasOwnProperty(key)) {
						deps.push(key + "@" + target.devDependencies[key]);
					}
				}
				replicateOne(fromRegistry, toRegistry, target, where, newPrev, newAnc, parent, cb);
			}, done);
		});
	});
}

function targetResolver(fromRegistry, toRegistry, where, family, ancestors, explicit, deps) {
	var alreadyInstalledManually = explicit ? [] : null;
	var nm = path.resolve(where, "node_modules");

	if (!explicit) fs.readdir(nm, function (er, inst) {
		if (er) {
			alreadyInstalledManually = [];
			return alreadyInstalledManually;
		}
		asyncMap(inst, function (pkg, cb) {
			readJson(path.resolve(nm, pkg, "package.json"), function (er, d) {
				if (er) {
					return cb(null, []);
				}
				if (semver.satisfies(d.version, deps[d.name] || "*")) {
					return cb(null, d.name);
				}
				return cb(null, []);
			});
		}, function (er, inst) {
			// this is the list of things that are valid and should be ignored.
			alreadyInstalledManually = inst;
		});
	});

	var to = 0;
	return function resolver(what, cb) {
		if (!alreadyInstalledManually) {
			return setTimeout(function () {
				resolver(what, cb);
			}, to++);
		}
		// now we know what's been installed here manually,
		// or tampered with in some way that npm doesn't want to overwrite.
		if (alreadyInstalledManually.indexOf(what.split("@").shift()) !== -1) {
			log.verbose("skipping " + what, "already installed in " + where);
			return cb(null, []);
		}

		if (family[what] && semver.satisfies(family[what], deps[what] || "")) {
			return cb(null, []);
		}

		if (deps[what]) {
			what = what + "@" + deps[what];
		}
		log.verbose(what, "cache add");
		npm.config.set("registry", fromRegistry.url);
		npm.config.del("_auth");
		npm.config.del("email");
		cache.add(what, function (er, data) {
			if (!er && data && family[data.name] === data.version) {
				return cb(null, []);
			}
			return cb(er, data);
		});
	};
}

function replicateOne(fromRegistry, toRegistry, target, where, family, ancestors, parent, cb) {
	var nm = path.resolve(where, "node_modules");
	var prettyWhere = relativize(where, process.cwd() + "/x");

	if (prettyWhere === ".") {
		prettyWhere = null;
	}

	chain([
		[checkCycle, target, ancestors],
		[publish, fromRegistry, toRegistry, target, family, ancestors]
	], function (er, d) {
		log.verbose(target._id, "replicateOne cb");
		if (er) {
			return cb(er);
		}

		d.push(resultList(target, where, parent));
		cb(er, d);
	});
}

function resultList(target, where, parent) {
	var nm = path.resolve(where, "node_modules");
	var prettyWhere = relativize(where, process.cwd() + "/x");

	if (prettyWhere === ".") {
		prettyWhere = null;
	}

	return [target._id, prettyWhere && parent, parent && prettyWhere];
}

function checkCycle(target, ancestors, cb) {
	// there are some very rare and pathological edge-cases where
	// a cycle can cause npm to try to install a never-ending tree
	// of stuff.
	// Simplest:
	//
	// A -> B -> A' -> B' -> A -> B -> A' -> B' -> A -> ...
	//
	// Solution: Simply flat-out refuse to install any name@version
	// that is already in the prototype tree of the ancestors object.
	// A more correct, but more complex, solution would be to symlink
	// the deeper thing into the new location.
	// Will do that if anyone whines about this irl.
	var p = Object.getPrototypeOf(ancestors);
	var name = target.name;
	var version = target.version;
	while (p && p !== Object.prototype && p[name] !== version) {
		p = Object.getPrototypeOf(p);
	}
	if (p[name] !== version) {
		return cb();
	}

	var er = new Error("Unresolvable cycle detected");
	var tree = [target._id, JSON.parse(JSON.stringify(ancestors))];
	var t = Object.getPrototypeOf(ancestors);
	while (t && t !== Object.prototype) {
		if (t === p) {
			t.THIS_IS_P = true;
		}
		tree.push(JSON.parse(JSON.stringify(t)));
		t = Object.getPrototypeOf(t);
	}
	log.verbose(tree, "unresolvable dependency tree");
	er.pkgid = target._id;
	er.errno = npm.ECYCLE;
	return cb(er);
}

function publish(fromRegistry, toRegistry, target, family, ancestors, cb_) {
	var pkg = target._npmJsonOpts.file.substring(0, target._npmJsonOpts.file.indexOf("/package.json")) + ".tgz";
	console.info("publishing " + target._id + "\n  from " + fromRegistry.url + "\n  to   " + toRegistry.url);

	npm.config.set("registry", toRegistry.url);
	npm.config.set("_auth", toRegistry.auth);
	npm.config.set("email", toRegistry.email);
	npm.commands.publish([pkg], function (er) {
		cb_(er);
	});
}