npm-bundle(1) -- Bundle package dependencies
============================================

## SYNOPSIS

    npm bundle [<cmd> ...]

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

Bins and man pages are not installed by bundle.

