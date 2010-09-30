npm-bundle(1) -- Bundle package dependencies
============================================

## EXPERIMENTAL

This is experimental functionality.  If you have thoughts about how it
should work, please post a comment at:
http://github.com/isaacs/npm/issues/issue/74

## SYNOPSIS

    npm bundle <folder> [<pkg>]

* `<folder>`:
  The place where bundled dependencies go.
* `<pkg>`:
  The package whose dependencies are to be bundled. Defaults to $PWD.
  See `npm help install` for more on the ways to identify a package.

## DESCRIPTION

Bundles all the dependencies of a package into a specific folder.

Furthermore, sets up an index.js in the folder that will shift it onto the
require.paths, and export the bundled modules.

For example, to install of your requirements into a "deps" folder,
you could do this:

    npm bundle deps

Assuming your code is in the "lib" folder, and it depended on a package
"foo", you could then do this:

    require("../deps") // this sets the require.paths properly.
    var foo = require("foo")

The bundle index will also return the modules that your package
depends on.  So, this would work as well:

    require("../deps").foo.createFoo(...)

The dependencies of those packages installed will also be installed and
linked, just like an `npm install` command.  In fact, internally `buffer`
just sets the `root` config and then does a normal `npm install` to put
the modules in place.

To update to new versions (or if the dependencies change) then run the
bundle command again.

## CAVEATS

There is no pretty to "remove" a package from a bundle at the moment.
However, you can do this:

    npm --root ./deps rm foo

Bins and man pages are not installed by bundle.

Packages are *built*, which often means they're compiled in that
architecture and against that version of node.  To update them, you can
do:

    npm --root ./deps rebuild

or run `npm bundle deps` on the target machine.

The `npm update` command will do *horrible* things to a bundle folder.
Don't ever point update at that root, or your bundles may no longer
satisfy your dependencies.

Bundle does *not* support version ranges like

    npm bundle deps sax@">=0.1.0 <0.2.0"

