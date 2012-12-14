/*
 * npm backfill [insert]
 * 
 * See doc/backfill.md for more description
 */

module.exports = backfill

backfill.usage = "npm backfill"
              + "\nnpm backfill "
              + "\nnpm backfill insert"
              + "\nIf no argument is supplied any existing [dev]Dependencies are clobbered"

backfill.completion = function (opts, cb) { }

var path = require("path")
  , fs = require("graceful-fs")
  , npm = require("./npm.js")
  , semver = require("semver");
  
function backfill(args, silent, cb) {
	
	if (typeof cb !== "function") cb = silent, silent = false;
	
	overwrite = true;

    args.forEach(function(arg) {
    	if (arg == 'insert') {
    		overwrite = false;
    	}
    });
    
    jsonFile = path.resolve('.') + '/package.json';
    if (!fs.existsSync(jsonFile)) cb("No package.json, create manually or run `npm init`", null);
    packageJson = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
    if (!packageJson) cb("Error parsing package.json");

    getPackageList(writeDependencies, cb);
}

writeDependencies = function(packageList, cb) {
    var dependencies = {};
    var devDependencies = {};
    if (overwrite == true) {
    	packageJson.dependencies = {};
    	packageJson.devDependencies = {};
    }
    if (!packageJson.dependencies) {
    	packageJson.dependencies = {};
    }
    if (!packageJson.devDependencies) {
    	packageJson.devDependencies = {};
    }
    for (packageName in packageList) {
    	var version = packageList[packageName];
    	packageJson.dependencies[packageName] = version;
    }
    fs.writeFile(jsonFile, JSON.stringify(packageJson, null, 2), function(err) {
    	if (err) return cb(err, null);
    	cb(null, null);
    });	
}

getPackageList = function(done, cb) {
	var packageList = {};
	var dir = path.resolve(npm.dir);
    var files = fs.readdir(dir, function(err, files) {
	    files.forEach(function(package) {
	        packageJsonFile = dir + '/' + package + '/package.json';
	        if (!fs.existsSync(packageJsonFile)) {
	        	console.log("No package.json in " + packageJsonFile);
	        } else {
		        data = fs.readFileSync(packageJsonFile, 'utf8'); 
		        info = JSON.parse(data);
		        packageList[info.name] = info.version;
		    }
	    });
	    done(packageList, cb);
	});
}