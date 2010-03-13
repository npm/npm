# Folder Structures Used by npm

Everything lives in the `root` setting. This defaults to
`$HOME/.node_libraries/`. I'd like to be able to override it, but that's not
possible yet.

`root/.npm/foo` is where the stuff for package `foo` would go.

`root/.npm/foo/1.0.0/package` the contents of the tarball containing foo
version 1.0.0

`root/.npm/foo/1.0.0/main.js` Generated file that exports the `main` module in
foo.

`root/.npm/foo/1.0.0/lib` symlink to the `lib` dir in foo.

`root/.npm/foo/active` symlink to the active version.

`root/foo-1.0.0.js` symlink to `.npm/foo/1.0.0/main.js`

`root/foo.js` symlink to `.npm/foo/active/main.js`

`root/foo` symlink to `.npm/foo/active/lib`

`root/foo-1.0.0` symlink to `.npm/foo/1.0.0/lib`
