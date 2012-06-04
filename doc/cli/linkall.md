npm-linkall(1) -- Symlink a package folder
==========================================

## SYNOPSIS

    npm linkall (in package folder)

## DESCRIPTION

`linkall` reads list of dependencies of the package and links all available
global packages which are depended on into local `node_modules` directory.

This is useful during development or when dealing with many private packages.
