npm-link(1) -- Symlink a package folder
=======================================

## SYNOPSIS

    npm link (in package folder)
    npm link <pkgname>


## DESCRIPTION

Package linking is a two-step process.

First, `npm link` in a package folder will create a globally-installed
symbolic link from `prefix/package-name` to the current folder.

Next, in some other location, `npm link package-name` will create a
symlink from the local `node_modules` folder to the global symlink.

When creating tarballs for `npm publish`, the linked packages are
"snapshotted" to their current state by resolving the symbolic links.

This is
handy for installing your own stuff, so that you can work on it and test it
iteratively without having to continually rebuild.

For example:

    cd ~/projects/node-redis    # go into the package directory
    npm link                    # creates global link
    cd ~/projects/node-bloggy   # go into some other package directory.
    npm link redis              # link-install the package

Now, any changes to ~/projects/node-redis will be reflected in
~/projects/node-bloggy/node_modules/redis/
