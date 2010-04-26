npm-link(1) -- Symlink a package folder
=======================================

## SYNOPSIS

    npm link <folder>

## DESCRIPTION

This will link a source folder into npm's registry using a symlink, and then
build it according to the package.json file in that folder's root. This is
handy for installing your own stuff, so that you can work on it and test it
iteratively without having to continually rebuild.
