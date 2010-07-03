npm(1) -- node package manager
==============================

## SYNOPSIS

    npm <command> [args]

## DESCRIPTION

npm is a little package manager for the Node javascript library.

See npm-help(1) for more details about specific commands.

npm supports a very basic argument parser.  For any of the settings
in npm-config(1), you can set them explicitly for a single command by 
doing:

    npm --key val <command>

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

See <http://github.com/isaacs/npm/issues> for current todo list.


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

* 0.1.4 - 0.1.5:
  Fixes for a few more bugs and fix some documentation.

* 0.1.6 - 0.1.7:
  Add cache functionality  
  Use couchdb attachments to host tarballs  
  Handle odd require.paths more appropriately  
  Don't break on install if the man path is missing  
  Support publishing or installing a folder or local tarball

* 0.1.8:
  Bugfixes  
  Add start, stop, restart, and test commands

* 0.1.9:
  npm list enhancements  
  fix the install bug

* 0.1.10:
  More errors found by Ryan Dahl and Kris Zyp  
  Better uninstall and list behavior  
  Docs for new developers.  
  Better tracking of ownership on the registry.

* 0.1.11:
	Martyn Smith found a whole lot of bugs.  
	Make publish not die when the tarball is big.  
	"make uninstall" support

* 0.1.12 - 0.1.13:
	Fix the downloading bug that was breaking the tarballs  
	Update some docs

* 0.1.14 - 0.1.16:
	Fix to stay in sync with node changes  
	Put a special tag on link installs  
	Modify semver comparison slightly  
	add unpublish command  
	Use the "drain" event properly for uploads  
	Handle thrown errors  
	Handle .npmignore

* 0.1.17:
  Stabilization.

* 0.1.18:
  Change a few default configurations  
  Add test harness  
  Default publish, install, and link to "." if no arguments given  


## SEE ALSO

npm-help(1)  
