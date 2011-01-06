npm activate(1) -- Activate an installed version of a package
=============================================================

## SYNOPSIS

    npm activate <name>@<version> [<name>@<version> ...]

## DESCRIPTION

This "activates" a specific version of a package, so that you can just do
`require("foo")` without having to specify the version.

## CONFIGURATION

### auto-activate

Default: true

Automatically activate a package after installation, if there is not an active
version already.  Set to "always" to always activate when installing.

## SEE ALSO

npm-deactivate(1)
