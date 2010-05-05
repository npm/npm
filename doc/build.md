npm-build(1) -- Build a package
===============================

## SYNOPSIS

    npm build <package-folder>

* `<package-folder>`:
  A folder containing a `package.json` file in its root.

## DESCRIPTION

This command should almost never need to be run directly.  It is an abstraction
of the functionality shared by both npm-install(1) and npm-link(1).

This command creates the various interwoven links that ensure a package's contents
are available in the root appropriately, and that its dependencies are linked
appropriately.

## SEE ALSO

* npm-install(1)
* npm-link(1)
* npm-scripts(1)
* npm-json(1)
