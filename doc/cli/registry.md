npm-registry(1) -- The JavaScript Package Registry
==================================================

## DESCRIPTION

To resolve packages by name and version, npm talks to a registry website
that implements the CommonJS Package Registry specification for reading
package info.

Additionally, npm's package registry implementation supports several
write APIs as well, to allow for publishing packages and managing user
account information.

The official public npm registry is at <http://registry.npmjs.org/>.  It
is powered by a CouchDB database at
<http://isaacs.iriscouch.com/registry>.  The code for the couchapp is
available at <http://github.com/isaacs/npmjs.org>.  npm user accounts
are CouchDB users, stored in the <http://isaacs.iriscouch.com/_users>
database.

The registry URL is supplied by the `registry` config parameter.  See
`npm-config(1)` for more on managing npm's configuration.

## Can I run my own private registry?

Yes!

The easiest way is to replicate the couch database, and use the same (or
similar) design doc to implement the APIs.

If you set up continuous replication from the official CouchDB, and then
set your internal CouchDB as the registry config, then you'll be able
to read any published packages, in addition to your private ones, and by
default will only publish internally.  If you then want to publish a
package for the whole world to see, you can simply override the
`--registry` config for that command.

## I don't want my package published in the official registry. It's private.

Set `"private": true` in your package.json to prevent it from being
published at all, or
`"publishConfig":{"registry":"http://my-internal-registry.local"}`
to force it to be published only to your internal registry.

See `npm-json(1)` for more info on what goes in the package.json file.

## Will you replicate from my registry into the public one?

No.  If you want things to be public, then publish them into the public
registry using npm.  What little security there is would be for nought
otherwise.

## Do I have to use couchdb to build a registry that npm can talk to?

No, but it's way easier.

## I published something elsewhere, and want to tell the npm registry about it.

This functionality is no longer supported, but this header is left for
historical purposes.

## Is there a website or something to see package docs and such?

Yes, head over to <https://npmjs.org/>

## SEE ALSO

* npm-config(1)
* npm-developers(1)
* npm-disputes(1)
