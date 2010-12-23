npm-run-script(1) -- Run arbitrary package scripts
==================================================

## SYNOPSIS

    npm run-script <script> <name>[@<version>] [<name>[@<version] ...]

## DESCRIPTION

This runs an arbitrary command from a package's "scripts" object.

If no version is provided then it uses the active version.

It is used by the test, start, restart, and stop commands, but can be
called directly, as well.

## SEE ALSO

* npm-scripts(1)
* npm-test(1)
* npm-start(1)
* npm-restart(1)
* npm-stop(1)
