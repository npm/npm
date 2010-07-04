# npm

This is just enough info to get you up and running.

More info available via `man npm`.

## Simple Install

To install npm, do this:

    curl http://npmjs.org/install.sh | sh

If it dies with a "Permission Denied" or EACCESS error, then that probably
means that you are running node in a shared root-owned location.  In that
case, you'll have to use sudo.

    curl http://npmjs.org/install.sh | sudo sh

## More Fancy Installing

First, get the code.  Maybe use git for this.  That'd be cool.  Very fancy.

The default make target is `install-stable`, which downloads the current stable
version of npm, and installs that for you.

If you want to install the exact code that you're looking at, the bleeding-edge
master branch, do this:

    make install

If you'd prefer to just symlink in the current code so you can hack
on it, you can do this:

    make link

If you check out the Makefile, you'll see that these are just running npm commands
at the cli.js script directly.  You can also use npm without ever installing
it by using `./cli.js` instead of "npm".

## Uninstalling

So sad to see you go.

		npm uninstall npm

Or, if that fails,

		make uninstall

## More Docs

Check out the [docs](http://github.com/isaacs/npm/blob/master/doc/).

You can use the [npm help](http://github.com/isaacs/npm/blob/master/doc/help.md#readme)
command to read any of them.

If you're a developer, and you want to use npm to publish your program,
you should
[read this](http://github.com/isaacs/npm/blob/master/doc/developers.md#readme)
