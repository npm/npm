npm-bundle(1) -- Bundle package dependencies
============================================

## SYNOPSIS

    npm bundle [<pkg>]

Run in a package folder.

* `<pkg>`:
  The package whose dependencies are to be bundled. Defaults to $PWD.
  See `npm help install` for more on the ways to identify a package.

## DESCRIPTION

When run in a package folder, this command can be used to install
package dependencies into the `node_modules` folder.

When the package is installed, it will read dependencies from the local
bundle *before* reading any dependencies that are already installed.

Furthermore, when installing, npm will not attempt to install
dependencies that already exist in the bundle.

In this way, a command like
`npm bundle http://github.com/user/project/tarball/master` can be used
to have a dependency that is not published on the npm registry.  (It
still must contain a package.json, though, of course.)

If called without an argument, it bundles all the dependencies of the
package.

In all ways, `npm bundle` is a shorthand for this:

    npm install (whatever)  \
      --root ./node_modules \
      --binroot false       \
      --manroot false

Bundles all the dependencies

## CAVEATS

There is no pretty to "remove" a package from a bundle at the moment.
However, you can do this:

    npm --root ./node_modules rm foo

Bins and man pages are not installed by bundle.

