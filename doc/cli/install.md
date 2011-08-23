npm-install(1) -- install a package
===================================

## SYNOPSIS

    npm install (with no args in a package dir)
    npm install <tarball file>
    npm install <tarball url>
    npm install <folder>
    npm install <name>
    npm install <name>@<tag>
    npm install <name>@<version>
    npm install <name>@<version range>

## DESCRIPTION

This command installs a package, and any packages that it depends on.

A `package` is:

* a) a folder containing a program described by a package.json file
* b) a gzipped tarball containing (a)
* c) a url that resolves to (b)
* d) a `<name>@<version>` that is published on the registry with (c)
* e) a `<name>@<tag>` that points to (d)
* f) a `<name>` that has a "latest" tag satisfying (e)

Even if you never publish your package, you can still get a lot of
benefits of using npm if you just want to write a node program (a), and
perhaps if you also want to be able to easily install it elsewhere
after packing it up into a tarball (b).


* npm install (in package directory, no arguments):
  Install the dependencies in the local node_modules folder.

  In global mode (ie, with `-g` or `--global` appended to the command),
  it installs the current package context (ie, the current working
  directory) as a global package.

* npm install `<folder>`:
  Install a package that is sitting in a folder on the filesystem.

* npm install `<tarball file>`:
  Install a package that is sitting on the filesystem.  Note: if you just want
  to link a dev directory into your npm root, you can do this more easily by
  using `npm link`.

  In order to distinguish between this and remote installs, the argument
  must either be "." or contain a "/" in it.

  Example:

      npm install ./package.tgz

* npm install `<tarball url>`:
  Fetch the tarball url, and then install it.  In order to distinguish between
  this and other options, the argument must start with "http://" or "https://"

  Example:

      npm install http://github.com/waveto/node-crypto/tarball/v0.0.5

* npm install `<name>`:
  Do a `<name>@<tag>` install, where `<tag>` is the "tag" config. (See
  `npm help config`)

  Example:

      npm install sax

* npm install `<name>@<tag>`:
  Install the version of the package that is referenced by the specified tag.
  If the tag does not exist in the registry data for that package, then this
  will fail.

  Example:

      npm install sax@stable

* npm install `<name>@<version>`:
  Install the specified version of the package.  This will fail if the version
  has not been published to the registry.

  Example:

      npm install sax@0.1.1

* npm install `<name>@<version range>`:
  Install a version of the package matching the specified version range.  This
  will follow the same rules for resolving dependencies described in `npm help json`.

  Note that most version ranges must be put in quotes so that your shell will
  treat it as a single argument.

  Example:

      npm install sax@">=0.1.0 <0.2.0"

You may combine multiple arguments, and even multiple types of arguments.
For example:

    npm install sax@">=0.1.0 <0.2.0" bench supervisor

The `--tag` argument will apply to all of the specified install targets.

The `--force` argument will force npm to fetch remote resources even if a
local copy exists on disk.

    npm install sax --force

The `--global` argument will cause npm to install the package globally
rather than locally.  See `npm help global`.

The `--link` argument will cause npm to link global installs into the
local space in some cases.

See `npm help config`.  Many of the configuration params have some
effect on installation, since that's most of what npm does.

## SEE ALSO

* npm-config(1)
* npm-build(1)
* npm-registry(1)
* npm-build(1)
* npm-link(1)
* npm-folders(1)
* npm-tag(1)
