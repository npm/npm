npm-folders(1) -- Folder Structures Used by npm
===============================================

## DESCRIPTION

Everything lives in the `root` setting.  Check `npm help config` for more
on configuration options.

`root/.npm/foo` is where the stuff for package `foo` would go.

`root/.npm/foo/1.0.0/package` the contents of the tarball containing foo
version 1.0.0

`root/.npm/foo/1.0.0/main.js` Generated file that exports the `main` module in
foo.  This is a shim, not a symbolic link, so that relative paths will work
appropriately.

`root/foo-1.0.0/{module-name}.js` Generated shim corresponding to a module
defined in the modules option. The module shim requires
`root/.npm/foo/1.0.0/package/{module-path}.js`

The `main` script is implemented by creating an `index.js` file in this folder.

`root/foo/` Symlink to the active version's module folder.

`root/.npm/foo/active` symlink to the active version.

`root/.npm/foo/1.0.0/dependencies` links to the modules that foo depends upon.
This is loaded into the require path first in the foo shims.

`root/.npm/foo/1.0.0/dependson` links to the package folders that foo depends
on.  This is here so that npm can access those packages programmatically.

`root/.npm/foo/1.0.0/dependents` links to the packages that depend upon foo.

`root/.npm/.cache` the cache folder.

`root/.npm/.cache/foo/1.0.0/package.json` the parsed package.json for foo@1.0.0

`root/.npm/.cache/foo/1.0.0/package.tgz` the tarball of foo@1.0.0

`root/.npm/.cache/foo/1.0.0/package` the untouched pristine copy of foo@1.0.0
