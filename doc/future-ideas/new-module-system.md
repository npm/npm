npm-folders(1) -- Folder Structures Used by npm
===============================================

## FUTURE

This functionality is not yet implemented.  It is a plan, not reality.
It is not the map, nor the territory, but a blueprint with blank areas.

In particular, this is the scheme that will be used starting in npm@0.3,
which will require node@0.5.0 or above.

## GOALS

* Don't splat stuff across the filesystem so much.  Just specify a single
root location, and be done with it.

* Work on windows.

* Minimize shim/symlink usage.

* Do not rely on any global system path for node modules.

* Remove the "activation" concept.

## DESCRIPTION

npm metadata lives in the `root` setting.  There is the cache folder,
and the contents of all installed packages.

The default npm root folder is `/usr/local/lib/npm`.

TODO: What should the root folder be on windows?

### Cache folder

The cache folder is a mirror of the data in the registry, as well as a
working space for unpacking and creating tarballs.

Files and folders created in the cache are owned by the executing user,
often "root".

Files are created with 0666 and folders with 0777, so that they can be
modified by any user.

* `root/cache` Cache folder
* `root/cache/foo/cache.json` Expirable cache of registry/foo json data
* `root/cache/foo/1.2.3/package` Pristine copy of foo package contents
* `root/cache/foo/1.2.3/package.tgz` tarball of foo@1.2.3

### Package folders

In the npm root folder, package contents are unpacked, built, and then
moved into the desired location.

* `root/packages/foo/1.2.3` Metadata and contents of foo@1.2.3
* `root/packages/foo/1.2.3/package` Build location of foo@1.2.3
* `root/packages/foo/1.2.3/node_modules` Links to (or, on windows, copies of)
  dependencies of foo@1.2.3
* `root/packages/foo/1.2.3/metadata.json` Metadata about the foo package.

### Installation in `node_modules` Folders

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

### Installing executables

When installing globally, executables are linked (or, on windows,
shimmed with a .bat file) to `root/bin`.

When doing a
localized installation, executables are linked (or, on windows, shimmed)
to `./node_modules/.bin`.  This also applies to the case when a globally
installed package's dependents are being installed into it.  Basically,
whenever writing `.../node_modules/foo`, and the "foo"
package has an executable named "bar", it'll write it to
`.../node_modules/.bin/bar`.

It is up to the user to update their PATH environment variable
appropriately for globally installed executables.  When running package
lifecycle scripts (for example, to build, start, test, etc.), npm will
put `./node_modules/.bin` as the first item in the PATH environ.

### Installing manpages

npm will install man pages to `root/share/man`.  It is up to the user to
make sure that their man program searches this location.

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
    |   `-- asdf@*
    `-- baz@1.2.3
        `-- quux@3.x

In this case, we'd expect a folder structure like this:

    foo
    +-- node_modules
        +-- bar (1.2.3)
        |   `-- node_modules
        |       `-- baz (2.0.2)
        +-- quux (3.2.0)
        +-- asdf (0.2.5)
        `-- baz (1.2.3)

Since foo depends directly on bar@1.2.3 and baz@1.2.3, those are
installed in foo's node_modules folder.

Since baz@1.2.3 depends on quux@3.x, a satisfying version is placed in
foo's node_modules folder, because there are no conflicts.

Since bar@1.2.3 depends on asdf@*, a satisfying version is placed in
foo's node_modules folder.  It also depends on baz@2.x, but this
conflicts with the version already installed in foo's node_modules
folder, so it is installed into the node_modules folder under bar@1.2.3.

baz@2.0.2 depends on quux@3.x, but this dependency is already satisfied
by the quux version installed in foo's node_modules folder, so nothing
further needs to be done.

### Snapshotting

Whenever the `npm snapshot` command is run, the package.json file is
updated to include the versions of all of the packages in the
`./node_modules` folder as dependencies.

### Publishing

Upon publishing, npm will look in the node_modules folder.  If any of
the items there are on the "dependencies" or "devDependencies" list, and
are unmodified copies of the corresponding packages in
`root/node_modules/<name>/<version>/package`, then they will not be
included in the package tarball.

If the package has been modified, then it is left as-is, and included in
the package.

This allows a package maintainer to install all of their dependencies
(and dev dependencies) locally, but only publish those items that cannot
be found elsewhere.

### Updating

npm keeps track of every installation of foo@1.2.3 in
`root/packages/foo/1.2.3/metadata.json`.

When updating in a package folder (see algorithm for determining this in
"Installation in `node_modules` Folders"), npm updates the packages in
the local folder to the latest versions that are compatible with the
requirements in the package.json file.

If global is set to `"super"`, then npm will attempt to update
all copies of packages installed anywhere and everywhere that it is
aware of.

If `global` is set to `true, or implied by not being in a package folder
at the time, then npm will update the globally installed packages.

If you do `npm update foo`, and you're in a local package folder, but
`foo` is not installed there, and it *is* installed globally, then that
will be equivalent to doing `npm update foo --global`.

### Uninstalling

Uninstalling works like updating.

If global is set to "super", then it removes all traces from everywhere.

If global is set to "true", or implied, then it removes the global copy.

If global is set to "false", or unset and the command is in a package
folder with a copy of the package being removed, then it removes it from
the local folder.

### Linking

When `npm link` is run without any arguments in a package folder, then a
symbolic link is created from that folder to `root/<name>/LINK`.
Additionally, its package dependencies are installed to its
./node_modules folder as necessary.

When `npm link <name>` is run in another package folder, a symbolic
link is created from `root/<name>/LINK` to `./node_modules/<name>`, and
its dependencies are also installed if necessary.  (Generally, it will
not be necessary, as the package will already have its own node_modules
folder containing its dependencies.)

When publishing, linked package dependencies are resolved to their
current state.  It is assumed that the linked folder was linked for a
reason, and may contain changes required for the proper functioning of
the host program.

#### npm link use case

    # create a linked "request" package
    cd ~/projects/request
    npm link

    # now write a program that uses request
    mkdir -p ~/projects/my-program
    cd ~/projects/my-program
    git init
    # do your git stuff...
    npm init
    # enter some package.json values
    # now we're ready to rock.
    # use redis, but don't need bleeding edge.
    npm install redis
    # use the linked copy of request
    npm link request

    # now any changes to ~/projects/request will
    # be immediately effective in my-program when
    # I do require("request")

#### link on Windows

Not sure how this will work.  Maybe linking simply isn't possible?
