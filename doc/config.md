npm-config(1) -- Manage the npm configuration file
==================================================

## SYNOPSIS

    npm config set <key> <value>
    npm config get <key>
    npm config delete <key>
    npm config list

## DESCRIPTION

The config command is a way to interact with the `.npmrc` file. This file is an
ini list of values that npm is concerned with.

On exit, the current state of the config is always saved, so that any changes
will be recorded. You may safely modify the file, but it is safer to use the
npm config commands.

If a file exists at `{PREFIX}/etc/npmrc`, then that is used, where `{PREFIX}`
is the install prefix of the node binary.  (That is, `which node` would show
`{PREFIX}/bin/node`.)  Otherwise, the file at `~/.npmrc` is read for values.

## Sub-commands

Config supports the following sub-commands:

### set

    npm config set key value

Sets the config key to the value.

### get

    npm config get key

Echo the config value to stdout. (NOTE: All the other npm logging is done to
stderr, so pipes should work properly, and you can do `npm get key 2>/dev/null`
to print out JUST the config value.)

### list

    npm config list

Show all the config settings.

**FIXME**: Prints to stderr, but should really be stdout, since the log is what
you're after.

### delete

    npm config delete key

Deletes the key from the configuration file.

## Config Settings

npm supports a very basic argument parser.  For any of the settings
in npm-config(1), you can set them explicitly for a single command by 
doing:

    npm --key val <command>

Configurations defined on the command line are not saved to the .npmrc file.

### auto-activate

Default: true

Automatically activate a package after installation, if there is not an active
version already.  Set to "always" to always activate when installing.

### root

Default: ~/.node_libraries in single-user mode, or `$INSTALL_PREFIX/lib/node`
in sudo-mode.

The root folder where packages are installed and npm keeps its data.

### binroot

Default: `$INSTALL_PREFIX/bin`

The folder where executable programs are installed.

### registry

Default: https://registry.npmjs.org/

The base URL of the npm package registry.

### _auth

A base-64 encoded "user:pass" pair.  This is created by npm-adduser(1).

If your config file is ever corrupted, you can set this manually by doing:

    npm adduser

### _authCrypt

If crypto.Cipher is available, and you have some private keys in `$HOME/.ssh`,
then npm will encrypt your "_auth" config before saving to the .npmrc file,
and will decrypt the "_authCrypt" config when it reads the .npmrc file.

### tag

Default: stable

If you ask npm to install a package and don't tell it a specific version, then
it will install the specified tag.

Note: this has no effect on the npm-tag(1) command.

### proxy

If proxy is available, then npm will fetch the modules from the registry via
the proxy server.

Example:

    proxy = http://proxy-server:8080
