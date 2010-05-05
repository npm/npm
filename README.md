# npm

Note: This is only half the info you need.  The rest can be seen via
`man npm` after installation.

## Installing

To install npm and its documentation, do this:

    node install-npm.js

If you'd prefer to just symlink in the current code so you can hack
on it, then you can do this to create a symlink:

    ./cli.js link .

If it dies with a "Permission Denied" or EACCESS error, then that probably
means that you are running node in a shared root-owned location.  In that
case, you'll have to use sudo, and it'll behave like a multi-user app.

You can customize this behavior by using the `root` and `binroot` config
options.  See npm-config(1)

## A note about password security

In order to publish your packages, you must have your auth info
saved into your .npmrc file.  If Cipher and Decipher are supported
in the "crypto" module, then npm will use them.  However, as of
node 0.1.92, these functions aren't integrated yet.

You can get around this by doing:

    npm install crypto@0.0.5
