# npm

This is just enough info to get you up and running.

More info available via `man npm`.

## Simple Install

To install npm, create a folder where you want to put the code, and then
cd there, and do this:

    curl -L http://github.com/isaacs/npm/tarball/master | tar xz --strip 1
    make

If it dies with a "Permission Denied" or EACCESS error, then that probably
means that you are running node in a shared root-owned location.  In that
case, you'll have to use sudo, and it'll behave like a multi-user app.

You can customize this behavior by using the `root` and `binroot` config
options.  See npm-config(1)

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
		
## A note about password security

In order to publish your packages, you must have your auth info
saved into your .npmrc file.  If Cipher and Decipher are supported
in the "crypto" module, then npm will use them.  However, as of
node 0.1.95, these functions aren't integrated yet.

You can get around this by doing:

    npm install crypto@0.0.5
