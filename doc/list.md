npm-list(1) -- List installed packages
======================================

## SYNOPSIS

    npm list
    npm ls

## DESCRIPTION

This command will print to stdout all the versions of packages that are
either installed or available in the registry, with their tags and whether
or not they're active and/or stable.

To filter a single package or state, you can provide words to filter on
and highlight (if appropriate).  For instance, to see all the stable
packages, you could do this:

    npm ls stable

Another common usage is to find the set of all packages that are 
installed. This can be accomplished by doing this:

    npm ls installed

## CONFIGURATION

### registry

Default: https://registry.npmjs.org/

The base URL of the npm package registry.

### listopts

Default: ""

A whitespace-separated list of extra args that are always passed to npm ls

For example: `listopts = remote`

`npm ls`

The output here will always filter by remote

### description

Default: true

Show the package description in npm ls.

### outfd

Default: Standard Output FD (1)

The file descriptor (integer) or stream object where npm will write
"normal" output.  For instance, the `ls` and `view` commands write their
output here.

When using npm programmatically, you may want to provide a
FileWriteStream, or some other form of WritableStream.

### color

Default: true

Set to false to disable colorized output.

In versions of node that expose the `isatty` function, npm will never
write colorized output to a non-terminal file descriptor.
