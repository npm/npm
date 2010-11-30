npm-tag(1) -- Tag a published version
=====================================

## SYNOPSIS

    npm tag <name>@<version> <tagname>

## DESCRIPTION

Tags the specified version of the package with the specified "tagname".

The only tag with special significance is "latest".  That version is
installed by default when no other tag or version number is specified,
and always points to the most recently updated version of a package.
