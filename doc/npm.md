npm(1) -- node package manager
==============================

## SYNOPSIS

    npm <command> [args]

## DESCRIPTION

npm is a little package manager for the Node javascript library.

Run `npm help` for help.  That's probably what you meant to do.

## STATUS: Useful Beta

The core functionality is there.  It works.

Please use this software.  It will cut you occasionally.  Let me know when
you find a rough edge, and I'll sand it down for you.

I appreciate your sense of adventure.

## PRINCIPLES

Put the files where they need to be so that node can find them using the
methods it already uses.

Be lazy, not clever.

The file system is the database.

Sync with habits that are already in use.

Packages should be maintained by their authors, not by the package manager
author.

Steer clear of dependency hell.

## BUGS

Plenty.  Luckily, npm is actively maintained as of this writing.

When you find issues, please report them:

* web:
  <http://github.com/isaacs/npm/issues>
* email:
  <npm-@googlegroups.com>

Be sure to include *all* of the output from the npm command that didn't work
as expected.

## HISTORY

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

* 0.1.19 - 0.1.20:
  Create a bunch of bugs  
  Fix a bunch of bugs  
  Some minor speed improvements 

* 0.1.21 - 0.1.22:
  Relative paths  
  Support comments in package.json  
  Add owner name to ls output  
  Add "owner" command to manage package owners  
  Support hook scripts in `{root}/.npm/.hooks/`  
  Initial support for config file relative to node executable  
  Support for http proxies  
  Documentation updates

* 0.1.23:
  update command - This is huge.  
  Rollback for failed installations  
  Install dependencies for link packages  
  Silently read passwords for adduser  
  Cascading configs: cli, env, user, global  
  First pass at `npm view` command

* 0.1.24, 0.1.25:
  Fix a bunch of things  
  Cleanup, etc.  
  help via --help, -h, or -?  
  
* 0.1.26:
  "modules" hash in package.json (Alex K. Wolfe)  
  Better "restart" command (Alex K Wolfe)  
  Work on Cygwin  
  Remove link packages properly  
  Make several commands more parallel

* 0.1.27:
  Man pages handled with the "man" entry, or a "man" directory  
  Install man pages in the "manroot" config dir  
  Control log output with the "loglevel" config  
  Support a "bin" directory of executables that get auto-linked  
  Un-deprecate the "lib" directory.  
  Bug killing  
  Split up the tar usage so it works on Solaris  
  bundle command  
  rebuild command

* 0.2.0:
  Lots more bug killing  
  Various fixes found during the Node Knockout extravaganza  
  Change all "name-version" things to be "name@version"  
  First allegedly "stable" release.

* 0.2.1:
  Minor updates and bugfixes

* 0.2.2:
  Update "help" to work on Solaris  
  Remove updated packages that don't have dependencies.  
  Allow implied suffixes on .js bins  
  Fix an "adduser" bug
