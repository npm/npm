npm-outdated(1) -- Check for outdated packages
==============================================

## SYNOPSIS

    npm outdated [<name> [<name> ...]]

## DESCRIPTION

This command will check the registry to see if any (or, specific) installed
packages are currently outdated.

## CONFIGURATION

### registry

Default: https://registry.npmjs.org/

The base URL of the npm package registry.

### tag

Default: latest

If you ask npm to install a package and don't tell it a specific version, then
it will install the specified tag.

Note: this has no effect on the npm-tag(1) command.

### outfd

Default: Standard Output FD (1)

The file descriptor (integer) or stream object where npm will write
"normal" output.  For instance, the `ls` and `view` commands write their
output here.

When using npm programmatically, you may want to provide a
FileWriteStream, or some other form of WritableStream.
