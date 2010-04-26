npm-registry(1) -- Notes on the JavaScript package registry
===========================================================

## MARKED FOR REMOVAL

This doc file will be removed once its contents have been implemented and its
data moved to the relevant command documentation.

## npm registry

Notes on npm's use of the [js-registry](http://github.com/mikeal/js-registry).

As of 2010-04-25, the "new commands" have been added, but the changes to the
"changed commands" have not been made yet.

## Changed commands

### install

Assuming that the stable branch of foo is 0.1.3, then all three of these do
the same thing:

    npm install foo
    npm install foo-0.1.3
    npm install foo 0.1.3

Furthermore, dependencies are installed implicitly.

### list

npm list will now also show packages that are in the registry for
installation, along with info about their tags and versions, etc. To limit to
a particular tag, preface it with @, for instance: `npm list foo @stable` to
show the stable version of foo. `npm list @stable` would so all packages with
a tag of `stable`.

The current behavior will be available via `npm list @installed`.

## Configuration

A registry base URL must be specified, either with the `--registry <url>` in
the command line, or by setting a registry url in the .npmrc file.

Also, need something to keep track of the user who's logged in? That's dicey.
