npm(1) -- node package manager
==============================

## SYNOPSIS

    npm <command> [args]

## DESCRIPTION

npm is a package manager for the Node javascript library.

Run `npm help` to get a list of commands.

## STATUS: Useful Beta

The core functionality is there.  It works.

Please use this software.  It will cut you occasionally.  Let me know when
you find a rough edge, and I'll sand it down for you.

I appreciate your sense of adventure.

## INTRO

You probably got npm because you want to install stuff.

Use `npm install blerg` to install the latest version of "blerg".  Check out
`npm help install` for more info.  It can do a lot of stuff.

Use the `npm ls` command to show everything that's available.  Looking for
express-related modules?  `npm ls express`.  Looking for the latest express?
`npm ls express latest`.  (The arguments are just simple greps.)  And of course,
`npm help ls` will tell you more.

Use `npm ls installed` to show everything you've installed.

## CONFIGS

Use the `npm config` command to manage how npm does stuff and where it puts things.
It stores your configs in the `~/.npmrc` file.  Check `npm help config` for more
info on that, if you care.

You can override any config for just a single command by doing `--configname value`
on the command line.

## DEVELOPERS

If you're using npm to develop and publish your code, check out the following topics:

* json:
  Make a package.json file.  The "json" help doc will tell you what to put in it.
* link:
  For linking your current working code into Node's path, so that you don't have to
  reinstall every time you make a change.  Use "npm link" to do this.
* install:
  It's a good idea to install things if you don't need the symbolic link.  Especially,
  installing other peoples code from the registry is done via "npm install".
* adduser:
  Use the `npm adduser` command to add a user account for the npm registry, or to
  authorize yourself on a new machine.  If you forget your password, send an email
  to <npm-@googlegroups.com> and we'll delete your account so you can recreate it.
* publish:
  Use the `npm publish` command to upload your code to the registry, so that other
  people can install it easily.

## CONTRIBUTIONS

Patches welcome!

* code:
  Read through `npm help coding-style` if you plan to submit code.  You don't have to
  agree with it, but you do have to follow it.
* docs:
  If you find an error in the documentation, edit the appropriate markdown file in the
  "doc" folder.  (Don't worry about generating the man page.)

Contributors are listed in npm's `package.json` file.

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

You can also look for isaacs in #node.js on irc://irc.freenode.net.

## HISTORY

See npm-changelog(1)
