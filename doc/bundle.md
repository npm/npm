npm-bundle(1) -- Bundle package dependencies
============================================

## SYNOPSIS

    npm bundle
    npm bundle destroy
    npm bundle <cmd> <args>

Run in a package folder.

## DESCRIPTION

When run in a package folder, this command can be used to install
package dependencies into the `node_modules` folder.

When the package is installed, it will read dependencies from the local
bundle *before* reading any dependencies that are already installed.

Furthermore, when installing, npm will not attempt to install
dependencies that already exist in the bundle.

To bundle all the dependencies of a given package, run `npm bundle`
without any arguments.

To completely remove the bundle folder, run `npm bundle destroy`.

To operate on the bundle packages, any npm command and arguments may be
passed to the `npm bundle` command.  For example, to install a package
into the bundle, you can do `npm bundle install express`.

To list the packages in the bundle, do `npm bundle ls`.  To remove bundled
packages, do `npm bundle remove <whatever>`.  Et cetera.

In this way, a command like
`npm bundle install http://github.com/user/project/tarball/master` can be used
to have a dependency that is not published on the npm registry.  (It still
must contain a package.json, though, of course.)

## CAVEATS

Man pages are not installed by bundle.

Bins are installed, but not globally.

When a dependency is specified as a URL rather than a version range, it
is bundled with the package depending upon it.

## CONFIGURATION

The bundle command itself is a proxy for `install`, or whichever command
is passed as the first argument.  As such, it uses
the same configuration parameters as the commands it proxies,
but with the following temporary changes:

* root: $PWD/node_modules/
* binroot: $PWD/node_modules/.bin
* manroot: null

See `npm help config` for more information on these.
