# npm registry

Notes on npm's use of the [js-registry](http://github.com/mikeal/js-registry).

None of this has been implemented as of 2010-03-10.

## New Commands

Add the following commands:

### publish

    npm publish <url>

Fetches the tarball from the url, checks the package.json, and sends to the registry as the
dist url.  Fails if the fetch is non-200, or if the version already exists in
the registry for that package.

### create

    npm create <project>

Create a new project in the registry.  Fails if this project already exists.  If given a path that contains a package.json file, then it'll use the name from that file.

### tag

    npm tag <project> <version> <tag>

Tag a project version with a tag, anything is fine.  Note that npm treats the "stable" tag a bit differently, preferring to install that one when not given a version.

## Configuration

A registry base URL must be specified, either with the `--registry <url>` in the command line, or by setting a registry url in the .npmrc file.

Also, need something to keep track of the user who's logged in?  That's dicey.
