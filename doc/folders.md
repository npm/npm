npm-folders(1) -- Folder Structures Used by npm
===============================================

## DESCRIPTION

npm puts various things on your computer.  That's its job.

This document will tell you what it puts where.

### prefix Configuration

The `prefix` config defaults to node's `process.installPrefix`.  On most
systems, this is `/usr/local`.

When the `global` flag is set, npm installs things into this prefix.
When it is not set, it uses the root of the current package, or the
current working directory if not in a package already.

### Node Modules

Packages are dropped into the `node_modules` folder under the `prefix`.
When installing locally, this means that you can
`require("packagename")` to load its main module, or
`require("packagename/path/to/sub/module")` to load other modules.

If you wish to install node modules globally which can be loaded via
`require()` from anywhere, then add the `prefix/node_modules` folder to
your NODE_PATH environment variable.

### Executables

When in global mode, executables are linked into `prefix/bin`.

When in local mode, executables are linked into
`prefix/node_modules/.bin`.

### Man Pages

When in global mode, man pages are linked into `prefix/share/man`.

When in local node, man pages are not installed.

### Cache

See `npm help cache`.  Cache files are stored in `~/.npm` on Posix, or
`~/npm-cache` on Windows.

This is controlled by the `cache` configuration param.

### Temp Files

Temporary files are stored by default in the folder specified by the
`tmp` config, which defaults to either the TMPDIR environment
variable, or `/tmp`.

Temp files are given a unique folder under this root for each run of the
program, and are deleted upon successful exit.

## More Information

When you run `npm install foo@1.2.3` it downloads and builds the
package, and then, if there is a package.json file in the current
working directory, it copies it to `$PWD/node_modules/foo`, so that your
current package will get it when you do `require("foo")`.

When this is done, it also installs all of foo's dependencies to
`./node_modules/foo/node_modules/`, so that it will get its dependencies
appropriately when it calls `require()`.  If foo depends on bar, and bar
depends on baz, then there will also be a
`./node_modules/foo/node_modules/bar/node_modules/baz`, and so on.

If there is not a package.json in the current working directory, then
npm walks up the working dir parent paths looking for a package.json,
indicating the root of a package, or a node_modules folder,
indicating an npm package deployment location, and then take the party to that
location.  This behavior may be suppressed by setting the `seek-root`
config value to false.

If no package root is found, then a global installation is performed.
The global installation may be supressed by setting the `global`
configuration to false, in which case, the install will fail.

### Global Installation

If the `global` configuration is set to true, or if it is not explicitly
set false and no suitable node_modules folder was found, then npm will
install packages "globally".

This means that the module contents are symlinked (or, on windows,
copied) from `root/<name>/<version>/package` to
`root/node_modules/<name>`.

### Cycles, Conflicts, and Folder Parsimony

Cycles are handled using the property of node's module system that it
walks up the directories looking for node_modules folders.  So, at every
stage, if a package is already installed in an ancestor node_modules
folder, then it is not installed at the current location.

Consider the case above, where `foo -> bar -> baz`.  Imagine if, in
addition to that, baz depended on bar, so you'd have:
`foo -> bar -> baz -> bar -> baz ...`.  However, since the folder
structure is: foo/node_modules/bar/node_modules/baz, there's no need to
put another copy of bar into .../baz/node_modules, since when it calls
require("bar"), it will get the copy that is installed in
foo/node_modules/bar.

This shortcut is only used if the exact same
version would be installed in multiple nested node_modules folders.  It
is still possible to have `a/node_modules/b/node_modules/a` if the two
"a" packages are different versions.  However, without repeating the
exact same package multiple times, an infinite regress will always be
prevented.

Another optimization can be made by installing dependencies at the
highest level possible, below the localized "target" folder.

For example, consider this dependency graph:

    foo
    +-- bar@1.2.3
    |   +-- baz@2.x
    |   |   `-- quux@3.x
    |   |       `-- bar@1.2.3 (cycle)
    |   `-- asdf@*
    `-- baz@1.2.3
        `-- quux@3.x
            `-- bar

In this case, we might expect a folder structure like this:

    foo
    +-- node_modules
        +-- bar (1.2.3)
        |   +-- node_modules
        |   |   `-- baz (2.0.2)
        |   |       `-- node_modules
        |   |           `-- quux (3.2.0)
        |   `-- asdf (2.3.4)
        `-- baz (1.2.3)
            `-- node_modules
                `-- quux (3.2.0)
                    `-- node_modules
                        `-- bar (1.2.3)
                            `-- node_modules
                                `-- asdf (2.3.4)

Since foo depends directly on bar@1.2.3 and baz@1.2.3, those are
installed in foo's node_modules folder.

Bar has dependencies on baz and asdf, so those are installed in bar's
node_modules folder.  Baz has a dependency on quux, so that is installed
in its node_modules folder.

Underneath bar, the `baz->quux->bar` dependency creates a cycle.
However, because `bar` is already in `quux`'s ancestry, it does not
unpack another copy of bar into that folder.

Similarly, underneath `foo->baz`, the same cycle is gradually prevented
because `bar`'s `quux` dependency is satisfied by its parent folder.

For a graphical breakdown of what is installed where, use `npm ls`.

### Publishing

Upon publishing, npm will look in the node_modules folder.  If any of
the items there are on the "dependencies" or "devDependencies" list,
and are not in the `bundledDependencies` array, then they will not be
included in the package tarball.

This allows a package maintainer to install all of their dependencies
(and dev dependencies) locally, but only re-publish those items that
cannot be found elsewhere.
