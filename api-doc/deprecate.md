npm-deprecate(3) -- Deprecate a version of a package
====================================================

## SYNOPSIS

    npm.commands.deprecate(args, callback)

## DESCRIPTION

This command will update the npm registry entry for a package, providing
a deprecation warning to all who attempt to install it.

The 'args' parameter must have exactly two elements:

* package@version:
  To specify a range, wrap the version in quotes (e.g. pkg@"< 1.2")
* message

Note that you must be the package owner to deprecate something.  See the
`owner` and `adduser` help topics.
