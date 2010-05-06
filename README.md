# npm

This is just enough info to get you up and running.

More info available via `man npm`.

## Simple Install

To install npm, do this:

    mkdir npm
    curl -L http://github.com/isaacs/npm/tarball/stable | tar xz --strip 1 -C npm
    node npm/install-npm.js

If it dies with a "Permission Denied" or EACCESS error, then that probably
means that you are running node in a shared root-owned location.  In that
case, you'll have to use sudo, and it'll behave like a multi-user app.

You can customize this behavior by using the `root` and `binroot` config
options.  See npm-config(1)

## More Fancy Installing

First, get the code.  Maybe use git for this.  That'd be cool.  Very fancy.

Once you have the code, run this thing, just like the simple install:

    node install-npm.js

If you'd prefer to just symlink in the current code so you can hack
on it, you can do this:

    npm link .

## A note about password security

In order to publish your packages, you must have your auth info
saved into your .npmrc file.  If Cipher and Decipher are supported
in the "crypto" module, then npm will use them.  However, as of
node 0.1.92, these functions aren't integrated yet.

You can get around this by doing:

    npm install crypto@0.0.5
