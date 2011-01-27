npm-install(1) -- install a package
===================================

## SYNOPSIS

    npm install <tarball file>
    npm install <tarball url>
    npm install <folder>
    npm install <name>
    npm install <name>@<tag>
    npm install <name>@<version>
    npm install <name>@<version range>

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

* npm install `<name>`:
  Do a `<name>@<tag>` install, where `<tag>` is the "tag" config from either your
  .npmrc file, or the --tag argument on the command line.

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

You may combine multiple arguments, and even multiple types of arguments.  For example:

    npm install sax@">=0.1.0 <0.2.0" bench supervisor

The `--tag` argument will apply to all of the specified install targets.

The `--force` argument will force npm to fetch remote resources even if a local copy exists on disk.

    npm install sax --force

## CONFIGURATION

### root

Default: `$INSTALL_PREFIX/lib/node`

The root folder where packages are installed and npm keeps its data.

### binroot

Default: `$INSTALL_PREFIX/bin`

The folder where executable programs are installed.

Set to "false" to not install executables

### manroot

Default: $INSTALL_PREFIX/share/man

The folder where man pages are installed.

Set to "false" to not install man pages.

### registry

Default: https://registry.npmjs.org/

The base URL of the npm package registry.

### tag

Default: latest

If you ask npm to install a package and don't tell it a specific version, then
it will install the specified tag.

Note: this has no effect on the npm-tag(1) command.

### dev

If set to a truish value, then it'll install the "devDependencies" as well as
"dependencies" when installing a package.

Note that devDependencies are *always* installed when linking a package.

### tar

Default: env.TAR or "tar"

The name of a GNU-compatible tar program on your system.

### gzip

Default: env.GZIPBIN or "gzip"

The name of a GNU-compatible gzip program on your system.

### must-install

Default: true

Set to false to not install over packages that already exist.  By
default, `npm install foo` will fetch and install the latest version of
`foo`, even if it matches a version already installed.

### auto-activate

Default: true

Automatically activate a package after installation, if there is not an active
version already.  Set to "always" to always activate when installing.

### update-dependents

Default: true

Automatically update a package's dependencies after installation, if it is the
newest version installed. Set to "always" to update dependents when a new
version is installed, even if it's not the newest.

## SEE ALSO

* npm-build(1)
* npm-registry(1)
* npm-build(1)
* npm-link(1)
* npm-folders(1)
* npm-tag(1)
