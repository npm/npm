npm(1) -- node package manager
==============================

## SYNOPSIS

    npm <command> [args]

## DESCRIPTION

npm is a little package manager for the Node javascript library.

Run `npm help` for more details about specific commands.

## STATUS: beta

The core functionality is there.  You can publish, tag, and install.  It
handles dependencies relatively smartly.

Please use this software.  It will cut you occasionally.  Let me know when
you find a rough edge, and I'll sand it down for you.

I appreciate your sense of adventure.

If you are a package maintainer, please investigate the documentation on
the `json`, `publish`, and `tag` sections first.  You might also want to
take a look at the `folders` section to see how you can leverage npm's
functionality for your own purposes.  You can get to these by running
`npm help <subject>` or, if you've installed the documentation, by doing
`man npm-<subject>`.

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
  "active" version.
* Safely uninstall packages, not removing them unless they have no dependents.
* Provide a utility for uploading a package.json to a js-registry repository.
* Handle circular dependencies nicely.
* Install and activate automatically.
* Be much smarter about cli arguments.
* Help topics.
* Install a "link" to a dev directory, so that it links it in rather than
  doing the moveIntoPlace step.

## Principles

Put the files where they need to be so that node can find them using the
methods it already uses.

Be lazy, not clever.

The file system is the database.

Sync with habits that are already in use.

Packages should be maintained by their authors, not by the package manager
author.

Run it on node. Cuz a node package manager should be written in evented
javascript.

## Contributing

If you're interested in helping, that's awesome! Please fork this project,
implement some of the things on the todo list, or fix an issue, or even
just write or edit some documentation.  You have no idea just how thankful
I'll be.

You can usually find me in #node.js on freenode.net, or you can reach me via
i@izs.me.

If you don't want to contribute patches, that's also cool.  It's very helpful
to have people play with npm and send issues or complaints.  It's stable in
what it does, so you may find it useful even if you just link in your stuff
by doing `npm link .` to put it in the `NODE_PATH` so you can pull it in
more easily.

If you have strong feelings about package managers, I'd love to hear your
opinions.

## Todo

* Uninstall dependent packages.
* Update dependencies when a new satisfying version is installed.
* A few of the commands are still a bit user-hostile, and crash in
  strange or un-helpful ways when they are not given the data they expect.
  Make them not do that.
* Some sugar to make it simpler to tie a git repo to a published package, and then
  automatically update the registry whenever a specific branch (or semver-looking
  tag) is pushed.
* Clean up after botched builds.  Rather than removing stuff, move it aside, and
  only remove it when the process succeeds.  If it fails, then roll it all back
  to the way it was beforehand.
* Show what can be installed by looking at the registry.
* Use path.relative so that the whole root can be picked up and moved easily.
* Change the registry so that it keeps the tarball as a couchdb attachment.
  (That's more a change to js-registry, not to npm, but they are related.)
* Ability to talk to more than one registry at a time.
* Abbrev support on the CLI commands
* A bash-completion script

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

* fixed a few bugs in semver
* refactor documentation
* add "help" command
* add install from registry
* everything else core
* push to beta

### 0.1.0 - 0.1.2

* push to beta, and announce
* clean up some bugs around lifecycle scripts
* reduce reliance on makefile
* documentation updates
* Fixed DOA bugs
* Removed dependence on ronn
