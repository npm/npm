npm-update(1) -- Update a package
=================================

## SYNOPSIS

    npm update [-g] [<name> [<name> ...]]

## DESCRIPTION

This command will update all the packages listed to the latest version
(specified by the `tag` config).

It will also install missing packages.

If the `-g` flag is specified, this command will update globally installed
packages.

If no package name is specified, all packages in the specified location (global
or local) will be updated.

## WARNING

By design, this command does **NOT** respect semantic versioning.  Running
`npm update` may break the current package by upgrading to incompatible newer
versions of dependencies.

Running `npm update -g` may break all globally installed packages, including
npm itself.

## SEE ALSO

* npm-install(1)
* npm-outdated(1)
* npm-registry(7)
* npm-folders(5)
* npm-ls(1)
