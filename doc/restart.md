npm-restart(1) -- Start a package
=================================

## SYNOPSIS

    npm restart <name>[@<version>] [<name>[@<version>] ...]

## DESCRIPTION

This runs a package's "restart" script, if one was provided.
Otherwise it runs package's "stop" script, if one was provided, and then
the "start" script.

If no version is specified, then it restarts the "active" version.

## SEE ALSO

* npm-start(1)
* npm-stop(1)
