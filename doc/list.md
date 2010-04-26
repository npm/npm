npm-list(1) -- List installed packages
======================================

## SYNOPSIS

    npm list [package]
    npm ls [package]

## DESCRIPTION

This will show the installed (and, potentially, activated) versions of all the
packages that npm has installed, or just the `package` if specified.

This is also aliased to `ls`.

**FIXME**: Prints to stderr, but should really be stdout, since the log is what
you're after.
