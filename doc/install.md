npm-install(1) -- install a package
===================================

## SUMMARY

    npm install <tarball>

## DESCRIPTION

This installs the package, where `tarball` is a url or path to a `.tgz` file
that contains a package with a `package.json` file in the root.

This'll create some stuff in `$HOME/.node_libraries`. It supports installing
multiple versions of the same thing.

From here, you can do `require("foo-1.2.3")` where "foo" is the name of the
package, and "1.2.3" is the version you installed.

Installing by name and version alone is planned for the next version.
