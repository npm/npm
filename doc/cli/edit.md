npm-edit(1) -- Edit an installed package
========================================

## SYNOPSIS

    npm edit <name>[@<version>]

## DESCRIPTION

Opens the package folder in the default editor (or whatever you've
configured as the npm `editor` config -- see `npm help config`.)

After it has been edited, the package is rebuilt so as to pick up any
changes in compiled packages.

For instance, you can do `npm install connect` to install connect
into your package, and then `npm edit connect` to make a few
changes to your locally installed copy.
