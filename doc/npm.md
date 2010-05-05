npm(1) -- node package manager
==============================

## SYNOPSIS

    npm <command> [args]

## DESCRIPTION

npm is a little package manager for the Node javascript library.

See npm-help(1) for more details about specific commands.

If you are a package maintainer, please investigate the documentation at
npm-json(1), npm-publish(1), and npm-tag(1) sections first.  See
npm-folders(1) section to see how you can leverage npm's functionality
for your own purposes.

## STATUS: beta

The core functionality is there.  You can publish, tag, and install.  It
handles dependencies relatively smartly.

Please use this software.  It will cut you occasionally.  Let me know when
you find a rough edge, and I'll sand it down for you.

I appreciate your sense of adventure.

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

If you don't want to contribute patches, that's also cool.  It's very helpful
to have people play with npm and send issues or complaints.  It's stable in
what it does, so you may find it useful even if you just link in your stuff
by doing `npm link .` to put it in the `NODE_PATH` so you can pull it in
more easily.

If you have strong feelings about package managers, I'd love to hear your
opinions.

You can usually find me in #node.js on freenode.net, or you can reach me via
i@izs.me.

## Todo

* Update dependencies when a new satisfying version is installed.
* Clean up after botched builds.  Rather than removing stuff, move it aside, and
  only remove it when the process succeeds.  If it fails, then roll it all back
  to the way it was beforehand.
* Some sugar to make it simpler to tie a git repo to a published package, and then
  automatically update the registry whenever a specific branch (or semver-looking
  tag) is pushed.
* Show what can be installed by looking at the registry.
* Use path.relative so that the whole root can be picked up and moved easily.
* Change the registry so that it keeps the tarball as a couchdb attachment.
  (That's more a change to js-registry, not to npm, but they are related.)
* Ability to talk to more than one registry at a time.
* Abbrev support on the CLI commands
* A bash-completion script
* chmod 0755 the bins automatically
* Use buffers to download tarballs, instead of the "binary" encoding.
* When the tarball is downloaded, save it to .tmp/name/ver/package.tgz,
  instead of some random garbage filename.
* Cache JSON files locally to .tmp/name/ver/package.json, even if the
  package isn't installed.  This would cut down on calls to the registry.


## Version History

* 0.0.1:
  Lots of sketches and false starts.  Abandoned a few times.

* 0.0.2:
  Install worked mostly.  Still promise-based.

* 0.0.3:
  Converted to callbacks.  
  Mikeal Rogers wrote a registry for it.

* 0.0.4:
  version dependencies  
  link packages  
  activation  
  lifecycle scripts  
  bin linking  
  uninstallation

* 0.0.5:
  fix a few bugs in uninstall wrt dependent packages  
  fix relative require()for nodejs modules installed with the "bin" field.  
  (issue #2)  
  update to work with node 0.1.33 (aka net2)  
  added publish and tag commands

* 0.0.6:
  set up a public registry  
  send content-length with registry PUTs  
  adduser command (Mikeal Rogers)  
  ini file stuff (Mikeal Rogers)  
  env-specific package.json  
  added more info to npm's the package.json (bugs, contributors, etc.)

* 0.0.7:
  fixed a few bugs in semver  
  refactor documentation  
  add "help" command  
  add install from registry  
  everything else core  
  push to beta

* 0.1.0 - 0.1.2:
  push to beta, and announce  
  clean up some bugs around lifecycle scripts  
  reduce reliance on makefile  
  documentation updates  
  Fixed DOA bugs  
  Removed dependence on ronn

* 0.1.3:
  Changed a few details with configs (fix #5)  
  Update adduser and publish to put author info in the data  
  Use buffer api for file writes, hopefully fix #4

## SEE ALSO

npm-help(1)  
