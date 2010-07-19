npm-uninstall(1) -- Remove a package
====================================

## SYNOPSIS

    npm uninstall <name>[@<version> [<name>[@<version>] ...]
    npm rm <name>[@<version> [<name>[@<version>] ...]

## DESCRIPTION

This uninstalls a package, completely removing everything installed for it. If
it's currently active, then it will be deactivated first, unless the
`auto-deactivate` config setting is set to "false". If anything is
depending on it, then those must be uninstalled first.

If the version is omitted, then all versions of a package are removed.

`<version>` may in fact be a version range, so these commands are
acceptable:

    npm rm foo@'1.2.3 - 4.8.9'
    npm rm foo@'>=1.0.0'
    npm rm foo@'<2.0.3'
