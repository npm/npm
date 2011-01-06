npm-folders(1) -- Folder Structures Used by npm
===============================================

## DESCRIPTION

Node modules and metadata live
in the `root` setting.  Check `npm help config` for more
on configuration options.

`root/foo` Symlink to the active version's module folder.

`root/foo@1.0.0/` Node modules for the foo package.

`root/foo@1.0.0/{module-name}.js` Generated shim corresponding to a module
defined in the modules option. The module shim requires
`root/.npm/foo/1.0.0/package/{module-path}.js`

The `main` script is implemented by creating an `index.js` file in this folder.

`root/.npm/foo` is where the stuff for package `foo` would go.

`root/.npm/foo/1.0.0/package` the contents of the tarball containing foo
version 1.0.0

`root/.npm/foo/1.0.0/main.js` Generated file that exports the `main` module in
foo.  This is a shim, not a symbolic link, so that relative paths will work
appropriately.

`root/.npm/foo/active` symlink to the active version.

`root/.npm/foo/1.0.0/node_modules` links to the modules that foo depends upon.
This is loaded into the require path first in the foo shims.

`root/.npm/foo/1.0.0/dependson` links to the package folders that foo depends
on.  This is here so that npm can access those packages programmatically.

`root/.npm/foo/1.0.0/dependents` links to the packages that depend upon foo.

`root/.npm/.cache` the cache folder.

`root/.npm/.cache/foo/1.0.0/package.json` the parsed package.json for foo@1.0.0

`root/.npm/.cache/foo/1.0.0/package.tgz` the tarball of foo@1.0.0

`root/.npm/.cache/foo/1.0.0/package` the untouched pristine copy of foo@1.0.0

Executables are installed to the folder specified by the `binroot` config.

`binroot/foo` Symlink to the active version of the "foo" executable.

`binroot/foo@1.0.0` An executable for foo at version 1.0.0.  Either a
symbolic link or a shim to a file in the foo package.

Man pages are installed to the folder specified by the `manroot` config.
Man pages named something other than the package name are prefixed with
the package name.

`manroot/man1/foo.1` Symlink to the section 1 manpage for the active
version of foo.

`manroot/man1/foo@1.0.0.1` Section 1 man page for foo version 1.0.0

`manroot/man8/foo-bar.8` Symlink to a section 8 manpage for the active
version of foo.

`manroot/man8/foo-bar@1.0.0.8` A section 8 manpage for foo version
1.0.0.

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
