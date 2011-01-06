npm-link(1) -- Symlink a package folder
=======================================

## SYNOPSIS

    npm link <folder>

## DESCRIPTION

This will link a source folder into npm's registry using a symlink, and then
build it according to the package.json file in that folder's root. This is
handy for installing your own stuff, so that you can work on it and test it
iteratively without having to continually rebuild.

## Linked Package Version

When linking a package folder, npm doesn't use the version in the
package.json file.  Instead, it creates a "fake" version number of:

    "9999.0.0-LINK-" + hash(folder)

This way, linking the same folder will always result in the same version
number, even if you bump the version in the package.json file.  The
extremely high major version ensures that it will always be considered
the "highest" version, since it is a development bleeding-edge thing.

## CONFIGURATION

See the config section of `npm help install`.  The `dev` configuration
setting is always set to `true` when doing a link install.
