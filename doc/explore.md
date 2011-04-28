npm-explore(1) -- Browse an installed package
=============================================

## SYNOPSIS

    npm explore <name>[@<version>] [ -- <cmd>]

## DESCRIPTION

Spawn a subshell in the directory of the installed package specified.

If a command is specified, then it is run in the subshell, which then
immediately terminates.

Note that the package is *not* automatically rebuilt afterwards, so be
sure to use `npm rebuild <pkg>` if you make any changes.
