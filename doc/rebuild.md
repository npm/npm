npm-rebuild(1) -- Rebuild a package
===================================

## SYNOPSIS

    npm rebuild [<name>[@<version>] [name[@<version>] ...]]

* `<name>`:
  The package to rebuild
* `<version>`:
  The version range to rebuild.  Any matching installed packages are rebuilt.

## DESCRIPTION

This command runs the `npm build` command on the matched folders.  This is useful
when you install a new version of node, and must recompile all your C++ addons with
the new binary.

Regardless of the configuration settings, rebuild always sets `update-dependents`
and `auto-activate` to false, to minimize unexpected side effects.  It does not
change any state outside of the package's folder.
