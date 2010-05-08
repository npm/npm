npm-cache(1) -- install a package
===================================

## SYNOPSIS

    npm cache add <tarball file>
    npm cache add <folder>
    npm cache add <tarball url>
    npm cache add <name> <version>
    
    npm cache ls [<path>]
    
    npm cache clean [<pkg> [<version>]]

## DESCRIPTION

* add:
  Access the local cache of package data.  This command is primarily
  intended to be used internally by npm, but it can provide a way to
  add data to the local installation cache explicitly.
  
  If two arguments are provided, then npm will fetch the data from the
  registry.  This allows npm to use the filesystem as a local proxy to
  the registry.

* ls:
  Show the data in the cache.  Additional arguments are joined together
  in a path-like fashion, but something like `npm cache ls npm/0.1.5` is
  acceptable as well.

* clean:
  Delete data out of the cache for a specific package and version, all
  versions of a package, or all data for all packages, depending on the
  arguments supplied.
  
  This can be used if invalid data gets into the cache.

## DETAILS

npm stores data for a version of a package in
`$ROOT/.npm/.cache/<name>/<version>`.  Three pieces of data are stored
in this folder:

* package/:
  A folder containing the package contents as they appear in the tarball.
* package.json:
  The package.json file, as npm sees it, with overlays applied and a _id attribute.
* package.tgz:
  The tarball for that version.

## HISTORY

Added in npm version 0.1.6
