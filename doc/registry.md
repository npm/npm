# npm registry

Notes on npm's use of the [js-registry](http://github.com/mikeal/js-registry).

None of this has been implemented as of 2010-03-10.

## New Commands

Add the following commands:

### publish

    npm publish <url>

Fetches the tarball from the url, checks the package.json, and sends to the
registry as the dist url. Fails if the fetch is non-200, or if the version
already exists in the registry for that package.

If the package is not already there, then publishing a tarball creates it.

### tag

    npm tag <project> <version> <tag>

Tag a project version with a tag, anything is fine. Note that npm treats the
"stable" tag a bit differently, preferring to install that one when not given
a version.

If the version doesn't exist, then it fails.

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
