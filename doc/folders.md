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

`root/.npm/foo/active` symlink to the active version.

`root/foo-1.0.0.js` symlink to `.npm/foo/1.0.0/main.js`

`root/foo.js` symlink to `.npm/foo/active/main.js`
