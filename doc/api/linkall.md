npm-linkall(3) -- Symlink all dependencies
==========================================

## SYNOPSIS

    npm.commands.linkall(callback)

## DESCRIPTION

`linkall` reads list of dependencies of the package and links all available
global packages which are depended on into local `node_modules` directory.

This is useful during development or when dealing with many private packages.
