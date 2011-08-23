npm-commands(3) -- npm commands
===============================

## SYNOPSIS

    npm.commands.<command>(args, callback)

## DESCRIPTION

npm comes with a full set of commands, and each of the commands takes a
similar set of arguments.

In general, all commands on the command object take an **array** of positional
argument **strings**. The last argument to any function is a callback. Some
commands are special and take other optional arguments.

All commands have their own man page. See `man npm-<command>` for command-line
usage, or `man 3 npm-<command>` for programmatic usage.

## COMMANDS

### install

Install a package.

* "install"
* "uninstall"
  "cache"
* "config"
* "set"
* "get"
* "update"
* "outdated"
* "prune"
* "submodule"
* "pack"

* "rebuild"
* "link"

* "publish"
* "tag"
  "adduser"
* "unpublish"
* "owner"
* "deprecate"

  "help"
* "help-search"
* "ls"
* "search"
* "view"
* "init"
* "version"
* "edit"
* "explore"
* "docs"
  "faq"
* "root"
* "prefix"
* "bin"
* "whoami"

* "test"
* "stop"
* "start"
* "restart"
* "run-script"
  "completion"

