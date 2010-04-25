npm(1) -- node package manager
==============================

## DESCRIPTION

npm is a little package manager for the Node javascript library.

## Installing

To install npm, do this:

    make install

If you get any complaints, try

    sudo make install

That will use npm to install itself, like
[Ouroboros](http://en.wikipedia.org/wiki/Ouroboros). From there, you can call
the command line program `npm`, and read this file by doing `man npm`.

Try `npm help` for more information.

## Status: alpha

This thing is a baby yet. But these kids grow up before you know it! Pretty
soon, you'll be all tapping out your pipe on the front porch, saying in your
withered old man voice, ***"I remember back before the war with the machines,
when that npm thing couldn't even install itself, and didn't know what a
version was. We used promises for everything and the global object was called
node. Movies were a nickel when we downloaded them from from the micro
torrents, and soda pop had corn syrup of the highest fructose imaginable. You
youngins don't know how good you got it."***

This isn't even beta, it's alpha. When most of the core functionality is
working, I'll make an announcement on the
[node.js](http://groups.google.com/group/nodejs) list. That'll be the `0.1.0`
version.

Here's what I mean by "core functionality":

* Install packages by name, and get the stable version.
* Install packages by supplying a name and version, and get the version
   specified.
* Install more than one package at a time by specifying them all on the
   command line.
* Install pre-requisites automatically, pulling the stable versions of the
   dependencies.
* Talk to a centralized repository to do all this package/version lookup
   magic.
* Install more than one version of a package, and optionally select an
   "active" version. (this works now)
* Safely uninstall packages, not removing them unless they have no dependents.
   (Override with a `--force` flag, of course.) (this works mostly, minus the
   `--force` bit.)
* Provide a utility for uploading a package.json to a js-registry repository.
   (totally works now. check out `npm publish <tarball-url>`.)
* Handle circular dependencies nicely.
* Install and activate automatically. (works now)
* Be much smarter about cli arguments.
* Help topics.
* Install a "link" to a dev directory, so that it links it in rather than
    doing the moveIntoPlace step. (works)
* Detect when a package has only been installed as a dependency, and be able
    to remove it when nothing else depends on it.

## Principles

Put the files where they need to be so that node can find them using the
methods it already uses.

Be easy, not clever.

The file system is the database.

Sync with the habits that are already in use.

Packages should be maintained by their authors, not by the package manager
author. (Especially if that's me, because I'm lazy.)

Run it on node. Cuz a node package manager should be written in evented
javascript.

## Contributing

If you're interested in helping, that's awesome! Please fork this project,
implement some of the things on the list, and then let me know. You can
usually find me in #node.js on freenode.net, or you can reach me via
<i@izs.me>.

If you don't want to contribute code, that's also cool.  It's very helpful
to have people play with npm and send issues or complaints.  It's stable in
what it does, so you may find it useful even if you just link in your stuff
by doing `npm link .` to put it in the `NODE_PATH` so you can pull it in
more easily.

If you have strong feelings about package managers, I'd love to hear your
opinions.

## Todo

All the "core functionality" stuff above.  Most immediately:

* Install packages from the registry.
* Install missing dependencies. For each one, fetch it, then figure out what
  it needs, then fetch that if we don't already have it, etc. Put off the
  resolveDependencies step until everything on the list has been installed,
  then go back and do the dependency linking.
* Uninstall dependent packages.
* Update dependencies when a new satisfying version is installed.
* Make the CLI not so user-hostile.

Some "nice to have" things that aren't quite core:

* Use path.relative so that the whole root can be picked up and moved easily.
* Specify the root (and other global options, perhaps) to the CLI.
* Parse command line options better, and pass an object to the npm command
  functions, rather than having everything just take one or two positional
  arguments.

## Version History

### 0.0.1

* Lots of sketches and false starts.  Abandoned a few times.

### 0.0.2

* Install worked mostly.  Still promise-based.

### 0.0.3

* Converted to callbacks.
* Mikeal Rogers wrote a registry for it.

### 0.0.4

* version dependencies
* link packages
* activation
* lifecycle scripts
* bin linking
* uninstallation

### 0.0.5

* fix a few bugs in uninstall wrt dependent packages
* fix relative require()for nodejs modules installed with the "bin" field.
  (issue #2)
* update to work with node 0.1.33 (aka net2)
* added publish and tag commands

### 0.0.6

* set up a public registry
* send content-length with registry PUTs
* adduser command (Mikeal Rogers)
* ini file stuff (Mikeal Rogers)
* env-specific package.json
* added more info to npm's the package.json (bugs, contributors, etc.)

### 0.0.7

* fixed a bug in semver
