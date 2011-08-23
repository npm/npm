npm-unpublish(1) -- Remove a package from the registry
======================================================

## SYNOPSIS

    npm unpublish <name>[@<version>]

## DESCRIPTION

This removes a package version from the registry, deleting its
entry and removing the tarball.

If no version is specified, or if all versions are removed then
the root package entry is removed from the registry entirely.
