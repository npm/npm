# npm – The Node Package Manager

npm is a little package manager for the Node javascript library.

For now, this README is more of a task list/roadmap than a proper "how to use this" type doc.

## Version - 0.0.3

3 isn't a very big number.  0 is even smaller, and there's 2 of those.

This thing is a baby yet.  But these kids grow up before you know it!  Pretty soon, you'll be all tapping out your pipe on the front porch, saying in your withered old man voice, <i>"I remember back before the war with the machines, when that npm thing couldn't even install itself, and didn't know what a version was.  We used promises for everything and the global object was called 'node'.  Movies were a nickel when we downloaded them from from the micro torrents, and soda pop had corn syrup of the highest fructose imaginable.  You youngins don't know how good you got it."</i>

This isn't even beta, it's alpha.  When most of the core functionality is working, I'll make an announcement on the [node.js](http://groups.google.com/group/nodejs) list.

Here's what I mean by "core functionality":

1. Install packages by name, and get the stable version.
2. Install packages by supplying a name and version, and get the version specified.
3. Install more than one package at a time by specifying them all on the command line.
4. Install pre-requisites automatically, pulling the stable versions of the dependencies.
5. Talk to a centralized repository to do all this package/version lookup magic.
6. Install more than one version of a package, and optionally select an "active" version.
7. Safely uninstall packages, not removing them unless they have no dependents.  (Override with a `--force` flag, of course.)
8. Provide a utility for uploading a package.json to a js-registry repository.
9. Handle circular dependencies nicely.
10. Install and activate automatically.
11. Read settings from a .npmrc file.
12. Be much smarter about cli arguments.
13. Help topics.
14. Install a "link" to a dev directory, so that it links it in rather than doing the moveIntoPlace step.

## Principles

Put the files where they need to be so that node can find them using the methods it already uses.

Be easy, not clever.

The file system is the database.

Sync with the habits that are already in use.

Packages should be maintained by their authors, not by the package manager author.  (Especially if that's me, because I'm lazy.)

Run it on node.  Cuz a node package manager should be written in evented javascript.

## Contributing

If you're interested in helping, that's awesome!  Please fork this project, implement some of the things on the list, and then let me know.  You can usually find me in #node.js on freenode.net, or you can reach me via <i@izs.me>.

If you have strong feelings about package managers, I'd love to hear your opinions.

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

Note that these script files don't have to be nodejs or even javascript programs.  They just have to be some kind of executable file.

## Todo

All the "core functionality" stuff above.  Most immediately:

* Keep track of what depends on what.
* Safely uninstall packages, failing if anything depends on it.
* Install packages from the registry
* Install missing dependencies.  This, with the registry, will make it so that circular dependencies are supported.
