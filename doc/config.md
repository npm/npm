npm-config(1) -- Manage the npm configuration file
==================================================

## SYNOPSIS

    npm config set <key> <value> [--global]
    npm config get <key>
    npm config delete <key>
    npm config list
    npm config edit

## DESCRIPTION

npm gets its configuration values from 5 sources, in this priority:

* cli:
  The command line flags.  Putting `--foo bar` on the command line sets the
  `foo` configuration parameter to `"bar"`.  A `--` argument tells the cli
  parser to stop reading flags.  A `--flag` parameter that is at the *end* of
  the command will be given the value of `true`.
* env:
  Any environment variables that start with `npm_config_` will be interpreted
  as a configuration parameter.  For example, putting `npm_config_foo=bar` in
  your environment will set the `foo` configuration parameter to `bar`.  Any
  environment configurations that are not given a value will be given the value
  of `true`.  Config values are case-insensitive, so `NPM_CONFIG_FOO=bar` will
  work the same.
* $HOME/.npmrc (or the `userconfig` param, if set above):
  This file is an ini-file formatted list of `key = value` parameters.
* $PREFIX/etc/npmrc (or the `globalconfig` param, if set above):
  This file is an ini-file formatted list of `key = value` parameters
* default configs:
  This is a set of configuration parameters that are internal to npm, and are
  defaults if nothing else is specified.

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

### delete

    npm config delete key

Deletes the key from all configuration files.

### edit

    npm config edit

Opens the config file in an editor.  Use the `--global` flag to edit the global config.

## Config Settings

npm supports a very basic argument parser.  For any of the settings
in npm-config(1), you can set them explicitly for a single command by 
doing:

    npm --key val <command>

Configurations defined on the command line are not saved to the .npmrc file.

### loglevel

Default: "info"

The log level to show.

Each level maps to a numeric value, above which all logs must pass to be
seen.  So, setting it to "warn" shows "win", "error" and "warn" messages.

The log levels:

* silent: Show no output.  Nothing.  If there is output on stderr, it's
  because something is broken.
* win: Show the "npm ok" or "npm not ok", but that's all.
* error: Errors, usually with a stack trace.
* warn: Things that you should probably be aware of.
* info: Helpful info.
* silly: Not-helpful info.  (Lots of dumping whole objects and such.)

Note that output to stdout is always printed.  This setting just modifies
what's logged to stderr.

### auto-activate

Default: true

Automatically activate a package after installation, if there is not an active
version already.  Set to "always" to always activate when installing.

### update-dependents

Default: true

Automatically update a package's dependencies after installation, if it is the
newest version installed. Set to "always" to update dependents when a new
version is installed, even if it's not the newest.

### root

Default: `$INSTALL_PREFIX/lib/node`

The root folder where packages are installed and npm keeps its data.

### binroot

Default: `$INSTALL_PREFIX/bin`

The folder where executable programs are installed.

Set to "false" to not install executables

### manroot

Default: $INSTALL_PREFIX/share/man

The folder where man pages are installed.

Set to "false" to not install man pages.

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

Default: latest

If you ask npm to install a package and don't tell it a specific version, then
it will install the specified tag.

Note: this has no effect on the npm-tag(1) command.

### proxy

If proxy is available, then npm will fetch the modules from the registry via
the proxy server.

Example:

    proxy = http://proxy-server:8080

### userconfig

The default user configuration file is process.env.HOME+"/.npmrc".

Note that this must be provided either in the cli or env settings. Once the
userconfig is read, it is irrelevant.

### globalconfig

The default global configuration file is resolved based on the location of the
node executable. It is process.execPath+"/../../etc/npmrc". In the canonical
NodeJS installation with `make install`, this is `/usr/local/etc/npmrc`. If you
put the node binary somewhere else (for instance, if you are using nvm or
nave), then it would be resolved relative to that location.

Note that this must be provided in the cli, env, or userconfig settings. Once
the globalconfig is read, this parameter is irrelevant.

### global

If set to some truish value (for instance, by being the last cli flag or being
passed a literal `true` or `1`), and the `npm config set` param is being
called, then the new configuration paramater is written global config file.
Otherwise, they are saved to the user config file.

### dev

If set to a truish value, then it'll install the "devDependencies" as well as
"dependencies" when installing a package.

Note that devDependencies are *always* installed when linking a package.

### tar

Default: env.TAR or "tar"

The name of a GNU-compatible tar program on your system.

### gzip

Default: env.GZIPBIN or "gzip"

The name of a GNU-compatible gzip program on your system.

### usage

If set to `true`, then this will tell help to print out the short usage statement
instead of the long manpage type thing.

This is set automatically if you invoke help like `npm command -?`.

### viewer

Default: "man"

The program to use to view help content.  Set to "woman" to use the emacs troff viewer
by that name.
