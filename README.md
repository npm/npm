# npm – The Node Package Manager

npm is a little package manager for the Node javascript library.

For now, this README is more of a task list/roadmap than a proper "how to use this" type doc.

## Contributing

If you're interested in helping, that's awesome!  Please fork this project, implement some of the things on the list, and then let me know.  You can usually find me in #node.js on freenode.net, or you can reach me via <i@izs.me>.

## Installation

To install npm, do this:

    $ node install-npm.js

That will use npm to install itself, like [Ouroboros](http://en.wikipedia.org/wiki/Ouroboros).  From there, you can call the command line program which is cleverly named `npm`.

## What works now:

In a nodejs program:

    require("./npm").install(tarball)

on the command line:

    npm install <tarball>

This installs the package, where `tarball` is a url or path to a `.tgz` file that contains a package with a `package.json` file in the root.

This'll create some stuff in `$HOME/.node_libraries`.  It supports installing multiple versions of the same thing.  Version activation, dependency resolution, and registry awareness are planned next.


## Package Lifecycle Scripts

npm supports the "scripts" member of the package.json script, for the following scripts:

`preinstall` - Run BEFORE the package is installed

`install` - Run AFTER the package is installed.

`preactivate` - Run BEFORE the package is activated.

`activate` - Run AFTER the package has been activated.

`deactivate` - Run BEFORE the package is deactivated.

`postdeactivate` - Run AFTER the package is deactivated.

`uninstall` - Run BEFORE the package is uninstalled.

`postuninstall` - Run AFTER the package is uninstalled.

Package scripts are run in an environment where the package.json fields have been tacked onto the `npm_package_` prefix.  So, for instance, if you had `{"name":"foo", "version":"1.2.5"}` in your package.json file, then in your various lifecycle scripts, this would be true:

    process.env.npm_package_name === "foo"
    process.env.npm_package_version === "1.2.5"

Objects are flattened following this format, so if you had `{"scripts":{"install":"foo.js"}}` in your package.json, then you'd see this in the script:

    process.env.npm_package_scripts_install = "foo.js"

If the script exits with a code other than 0, then this will abort the process.

## Todo

* Install packages from the registry
* Install missing dependencies.  This, with the registry, will make it so that circular dependencies are supported.
* Safely uninstall packages, failing if anything depends on it.
* Keep track of what depends on what.
* Add an "activate" step.  Now that the deps are all included into the package, this isn't any big deal, really.  But the list command should show which one is active.
