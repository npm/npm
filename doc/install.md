npm-install(1) -- install a package
===================================

## SYNOPSIS

    npm install <tarball file>
    npm install <tarball url>
    npm install <folder>
    npm install <pkg>
    npm install <pkg>@<tag>
    npm install <pkg>@<version>
    npm install <pkg>@<version range>

## DESCRIPTION

This command installs a package, and any packages that it depends on.  It
resolves circular dependencies by talking to the npm registry.

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

* npm install `<pkg>`:
  Do a `<pkg>@<tag>` install, where `<tag>` is the "tag" config from either your
  .npmrc file, or the --tag argument on the command line.

  Example:

      npm install sax

* npm install `<pkg>@<tag>`:
  Install the version of the package that is referenced by the specified tag.
  If the tag does not exist in the registry data for that package, then this
  will fail.

  Example:

      npm install sax@stable

* npm install `<pkg>@<version>`:
  Install the specified version of the package.  This will fail if the version
  has not been published to the registry.

  Example:

      npm install sax@0.1.1

* npm install `<pkg>@<version range>`:
  Install a version of the package matching the specified version range.  This
  will follow the same rules for resolving dependencies described in `npm help json`.

  Note that most version ranges must be put in quotes so that your shell will
  treat it as a single argument.

  Example:

      npm install sax@">=0.1.0 <0.2.0"

You may combine multiple arguments, and even multiple types of arguments.  For example:

    npm install sax@">=0.1.0 <0.2.0" bench supervisor

The `--tag` argument will apply to all of the specified install targets.

## SEE ALSO

* npm-build(1)
* npm-registry(1)
* npm-build(1)
* npm-link(1)
* npm-folders(1)
* npm-tag(1)
