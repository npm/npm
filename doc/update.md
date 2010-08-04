npm-update(1) -- Update a package
=================================

## SYNOPSIS

    npm update [<pkg> [<pkg> ...]]

## DESCRIPTION

This command will update all the packages listed to the latest version
(specified by the `tag` config), as well as updating any dependent
packages to use the new version, if possible.

Additionally, it will activate the new version, and delete any old versions, if
safe to do so

If the `update-dependents` configuration parameter is set to `"true"`, then
packages will always be updated when they are installed, if they are the newest
version.

If the `update-dependents` configuration parameter is set to `"always"`, then
packages will be updated when they are installed, even if to do so would be a
downgrade.
