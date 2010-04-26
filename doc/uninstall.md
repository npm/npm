npm-uninstall(1) -- Remove a package
====================================

## SYNOPSIS

    npm uninstall <name> <version>
    npm rm <name> <version>

## DESCRIPTION

This uninstalls a package, completely removing everything installed for it. If
it's currently active, then it must be deactivated first. If anything is
depending on it, then those must be uninstalled first.
