# npm

## Installing

To install npm, do this:

    make install

If you get any complaints, try

    sudo make install

That will use npm to install itself, like
[Ouroboros](http://en.wikipedia.org/wiki/Ouroboros).

Then do `man npm` or `npm help` for more information.

## A note about password security

In order to publish your packages, you must have your auth info
saved into your .npmrc file.  If Cipher and Decipher are supported
in the "crypto" module, then npm will use them.  However, as of
node 0.1.92, these functions aren't integrated yet.

You can get around this by doing:

    npm install http://github.com/waveto/node-crypto/tarball/v0.0.5
