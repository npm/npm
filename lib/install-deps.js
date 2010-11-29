
var npm = require("../npm")
  , readInstalled = require("./utils/read-installed")
  , readDependencies = require("./utils/read-dependencies")
  , log = require("./utils/log")
  , path = require("path")
  , semver = require("./utils/semver")
  , installedPackages

module.exports = install_deps;

install_deps.usage = "npm install-deps <folder>"
              + "\nInstalls '.' if no argument supplied"

function install_deps(folders, cb) {
  log.verbose(folders, "install-deps")
  if (folders.length === 0) folders = ["."]
  
  folders.forEach(function(folder){
    if (folder.charAt(0) !== "/") folder = path.join(process.cwd(), folder)
    
    readDependencies(path.join(folder, "package.json"), function(er, deps){
      if (er) return log.er(cb, "Couldn't read dependencies")(er)
      
      readInstalled(Object.keys(deps), function (er, installed) {
        if (er) return log.er(cb, "Couldn't read installed packages")(er)

        var required = [];

        Object.keys(deps).forEach(function(dep){
          if(dep in installed) {
            log.verbose(dep, "dep installed")
            var statis = semver.maxSatisfying(Object.keys(installed[dep]), deps[dep])
            if(statis) {
              log.verbose(dep, "dep version statisfied")
            } else {
              required.push(dep+"@"+deps[dep])
            }
          } else {
            required.push(dep+"@"+deps[dep])
          }
        });

        if(required.length){
          npm.commands.install(required, function (er) {
            if (!er) return cb(null)
            // error, rollback
            npm.ROLLBACK = true
            log.error(er, "error linking, rollback")
            npm.commands.rm(required, function (er_) {
              if (er_) log.error(er_, "error rolling back")
              cb(er)
            })
          })
        } else {
          cb(null)
        }
      });
    });
  })
}