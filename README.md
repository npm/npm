# npm

This is just enough info to get you up and running.

More info available via `man npm`.

## IMPORTANT

You need node v0.2.0 or higher to run this program.

You shouldn't use sudo with it.

## Simple Install

To install npm, do this:

    curl http://npmjs.org/install.sh | sh

If it dies with a "Permission Denied" or EACCESS error, then that probably
means that you are running node in a shared root-owned location.  You've
got options.

Using sudo with npm is Very Not Recommended.  Either chown the folder that
is your node install prefix, or set up a `.npmrc` file pointing `root`,
`binroot`, and `manroot` to folders that you own.  (The .npmrc is just an
ini-formatted file, so you can use any editor to do this.)

## More Fancy Installing

First, get the code.  Maybe use git for this.  That'd be cool.  Very fancy.

The default make target is `install`, which downloads the current stable
version of npm, and installs that for you.

If you want to install the exact code that you're looking at, the bleeding-edge
master branch, do this:

    make dev

If you'd prefer to just symlink in the current code so you can hack
on it, you can do this:

    make link

If you check out the Makefile, you'll see that these are just running npm commands
at the cli.js script directly.  You can also use npm without ever installing
it by using `node cli.js` instead of "npm".  Set up an alias if you want, that's
fine.  (You'll still need read permission to the root/binroot/manroot folders,
but at this point, you probably grok all that anyway.)

## Uninstalling

So sad to see you go.

		npm uninstall npm

Or, if that fails,

		make uninstall

## Install Problems

There's was an issue prior to npm version 0.2.0 where packages whose names contained
hyphen characters would be odd.

If you've installed any packages with `-` in the name prior to 0.2.0, then you ought
to remove and reinstall them.

## More Docs

Check out the [docs](http://github.com/isaacs/npm/blob/master/doc/).

You can use the [npm help](http://github.com/isaacs/npm/blob/master/doc/help.md#readme)
command to read any of them.

If you're a developer, and you want to use npm to publish your program,
you should
[read this](http://github.com/isaacs/npm/blob/master/doc/developers.md#readme)
