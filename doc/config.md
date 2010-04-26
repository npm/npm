npm-config(1) -- Manage the npm configuration file
==================================================

## SYNOPSIS

    npm config set <key> <value>
    npm config get <key>
    npm config delete <key>
    npm config list

## DESCRIPTION

The config command is a way to interact with the `.npmrc` file. This file is a
JSON encoded list of values that npm is concerned with. The first time you run
npm, it will create a conf file filled with default values.

On exit, the current state of the config is always saved, so that any changes
will be recorded. You may safely modify the file (as long as it's still
parseable JSON), but it is safer to use the npm config commands.

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

## Config File Settings

### auto-activate

Default: true

Automatically activate a package after installation, if there is not an active
version already.  Set to "always" to always activate when installing.

### root

Default: ~/.node_libraries

The root folder where packages are installed and npm keeps its data.

### registry

Default: http://registry.npmjs.org/

The base URL of the npm package registry.

### auth

A base-64 encoded "user:pass" pair.

**FIXME**: This is not encoded in any kind of security sense. It's just base-64
encoded strictly so that it can be sent along the wire with HTTP Basic
authentication. An upcoming version of npm will encrypt this and save it back
to the registry as `auth-crypt`, which will be quite a bit more secure. Until
then, use a unique password that you don't mind being compromised.

