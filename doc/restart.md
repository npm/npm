npm-restart(1) -- Start a package
=================================

## SYNOPSIS

    npm restart <name> [<version>]

## DESCRIPTION

This runs a package's "stop" script, if one was provided, and then
the "start" script.

If no version is specified, then it restarts the "active" version.

This is identical to doing:

    npm stop <name>
    npm start <name>

## SEE ALSO

* npm-start(1)
* npm-stop

