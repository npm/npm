npm-edit(1) -- Edit an installed package
========================================

## SYNOPSIS

    npm edit <name>[@<version>]

## DESCRIPTION

Opens the package folder in the default editor (or whatever you've
configured as the npm `editor` config -- see `npm help config`.)

After it has been edited, the package is rebuilt so as to pick up any
changes in compiled packages.

Note: If you're finding yourself using this a lot, it's probably better
to use `npm link` instead.  However, it is extremely handy when used in
conjunction with `npm bundle`.

For instance, you can do `npm bundle install connect` to install connect
into your package, and then `npm bundle edit connect` to make a few
changes to your locally bundled copy.
