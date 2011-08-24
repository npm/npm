npm(3) -- node package manager
==============================

## SYNOPSIS

    var npm = require("npm")
    npm.load(configObject, function (er, npm) {
      // use the npm object, now that it's loaded.
    })

## DESCRIPTION

Since you're looking at this man page, you are probably wanting to integrate
npm into your program.  To find documentation of the npm command line
client, then use `npm help npm` or `man npm`.

Every time you use npm, you must call `npm.load()` with an object hash of
command-line configs. After that, each of the functions are accessible in the
commands object: `npm.commands.<cmd>`  Check out `npm help config` or
for all available options.

All commands on the command object take an **array** of positional argument
**strings**. The last argument to any function is a callback. Some commands are
special and take other optional arguments.

Configs cannot currently be set on a per function basis, as each call to
npm.config.set will change the value for *all* npm commands in that process.

To find API documentation for a specific command, try the man pages first.

