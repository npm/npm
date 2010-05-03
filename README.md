# npm

Note: This is only half the info you need.  The rest can be seen via
`man npm` after installation.

## Installing

To install npm and its documentation, do this:

    make install

If you get any complaints, try

    sudo make install

Then do `man npm` or `npm help` for more information.

If you want to just install npm, but leave your man folder untouched,
you can try this instead:

    node install-npm.js

If you'd prefer to just symlink in the current code so you can hack
on it, then you can do this to create a symlink:

    ./cli.js link .

Any of these will use npm to install itself, like
[Ouroboros](http://en.wikipedia.org/wiki/Ouroboros).

## A note about password security

In order to publish your packages, you must have your auth info
saved into your .npmrc file.  If Cipher and Decipher are supported
in the "crypto" module, then npm will use them.  However, as of
node 0.1.92, these functions aren't integrated yet.

You can get around this by doing:

    npm install http://github.com/waveto/node-crypto/tarball/v0.0.5
