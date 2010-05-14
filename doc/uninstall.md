npm-uninstall(1) -- Remove a package
====================================

## SYNOPSIS

    npm uninstall <name> [<version>]
    npm rm <name> [<version>]

## DESCRIPTION

This uninstalls a package, completely removing everything installed for it. If
it's currently active, then it will be deactivated first, unless the
`auto-deactivate` config setting is set to "false". If anything is
depending on it, then those must be uninstalled first.

If the version is omitted, then all versions of a package are removed.
