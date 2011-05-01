npm-folders(1) -- Folder Structures Used by npm
===============================================

## DESCRIPTION

npm puts various things on your computer.  That's its job.

This document will tell you what it puts where.

### tl;dr

* Local install (default): puts stuff in ./node_modules
* Global install (with `-g`): puts stuff in /usr/local
* Install it **locally** if you're going to `require()` it.
* Install it **globally** if you're going to run it on the command line.

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
`require("packagename/lib/path/to/sub/module")` to load other modules.

If you wish to `require()` a package, then install it locally.

### Executables

When in global mode, executables are linked into `prefix/bin`.

When in local mode, executables are linked into
`prefix/node_modules/.bin`.

### Man Pages

When in global mode, man pages are linked into `prefix/share/man`.

When in local mode, man pages are not installed.

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

When doing local installings, npm first tries to find an appropriate
`prefix` folder.  This is so that `npm install foo@1.2.3` will install
to the sensible root of your package, even if you happen to have `cd`ed
into some other folder.

Starting at the $PWD, npm will walk up the folder tree checking for a
folder that contains either a `package.json` file, or a `node_modules`
folder.  If such a thing is found, then that is treated as the effective
"current directory" for the purpose of running npm commands.  (This
behavior is inspired by and similar to git's .git-folder seeking
logic when running git commands in a working dir.)

If no package root is found, then the current folder is used.

When you run `npm install foo@1.2.3`, then the package is loaded into
the cache, and then unpacked into `./node_modules/foo`.  Then, any of
foo's dependencies are similarly unpacked into
`./node_modules/foo/node_modules/...`.

Any bin files are symlinked to `./node_modules/.bin/`, so that they may
be found by npm scripts when necessary.

### Global Installation

If the `global` configuration is set to true, or if it is not explicitly
set false and no suitable node_modules folder was found, then npm will
install packages "globally".

For global installation, packages are installed roughly the same way,
but the module root is `/usr/local/lib/node_modules`, and bin files are
linked to `/usr/local/bin` instead of `./node_modules/.bin`.

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
        +-- bar (1.2.3) <---[A]
        |   +-- node_modules
        |   |   `-- baz (2.0.2) <---[B]
        |   |       `-- node_modules
        |   |           `-- quux (3.2.0)
        |   `-- asdf (2.3.4)
        `-- baz (1.2.3) <---[C]
            `-- node_modules
                `-- quux (3.2.0) <---[D]

Since foo depends directly on bar@1.2.3 and baz@1.2.3, those are
installed in foo's node_modules folder.

Bar [A] has dependencies on baz and asdf, so those are installed in bar's
node_modules folder.  Because it depends on `baz@2.x`, it cannot re-use
the `baz@1.2.3` installed in the parent node_modules folder [C], and
must install its own copy [B].

Underneath bar, the `baz->quux->bar` dependency creates a cycle.
However, because `bar` is already in `quux`'s ancestry [A], it does not
unpack another copy of bar into that folder.

Underneath `foo->baz` [C], quux's [D] folder tree is empty, because its
dependnecy on bar is satisfied by the parent folder copy installed at [A].

For a graphical breakdown of what is installed where, use `npm ls`.

### Publishing

Upon publishing, npm will look in the node_modules folder.  If any of
the items there are on the "dependencies" or "devDependencies" list,
and are not in the `bundledDependencies` array, then they will not be
included in the package tarball.

This allows a package maintainer to install all of their dependencies
(and dev dependencies) locally, but only re-publish those items that
cannot be found elsewhere.
