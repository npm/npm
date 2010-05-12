npm-list(1) -- List installed packages
======================================

## SYNOPSIS

    npm list
    npm ls

## DESCRIPTION

This command will print to stdout all the versions of packages that are
either installed or available in the registry, with their tags and whether
or not they're active and/or stable.

To filter a single package or state, pipe this command through grep.

    npm ls | grep @stable
