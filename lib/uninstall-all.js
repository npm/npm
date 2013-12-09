
module.exports = uninstallAll

uninstallAll.usage = "npm uninstallAll"

var npm = require("./npm.js")
	, log = require("npmlog")

uninstallAll.completion = npm.commands.config.completion

function uninstallAll (args, cb) {
	//This is intended to help uninstall all node_modules in case the file path
	//gets too long for the Windows OS. If it gets too long traditional delete
	//commands fail. Continuous Integration solutions like Jenkins also fail
	//due to the inability to delete the node_modules folder.
	npm.ls(function(error, data, lite){
		for(var dependency in lite.dependencies){
			if (!lite.dependencies[dependency].missing) {
				npm.uninstall(dependency);
				log.info("uninstalling: " + dependency);
			}else {
				log.info("no uninstalling: " + dependency);
			}
		}
	});

	console.log("uninstallAll done");
	cb();
}
