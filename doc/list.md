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

Strings are matched using the JavaScript "split" function, so regular
expression strings are ok.  However, the highlighting is a simple
split/join, so regexps probably won't get the funky colors.
