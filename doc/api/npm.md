npm(3) -- node package manager
==============================

## SYNOPSIS

    var npm = require("npm")
    npm.load(configObject, function (er, npm) {
      // use the npm object, now that it's loaded.
    })

## DESCRIPTION

Since you're looking at this man page, you are probably wanting to integrate
npm into your program.  If you want to 

Every time you use npm, you must call npm.load() with an object hash of
command-line configs. After that, each of the functions are accessible in the
commands object: `npm.commands.<cmd>`  Check out `npm help config` or
`man npm-config` for all available options.

All commands on the command object take an **array** of positional argument
**strings**. The last argument to any function is a callback. Some commands are
special and take other optional arguments.

Configs cannot currently be set on a per function basis, as each call to
npm.config.set will change the value for *all* npm commands in that process.

To find API documentation for a specific command, try the man pages first.
For example, if you wanted documentation on how the "update" command works, try
`man 3 npm-commands-load`.

If all else fails, read the source.

## CONTRIBUTIONS

Patches welcome!

* code:
  Read through `npm help coding-style` if you plan to submit code.
  You don't have to agree with it, but you do have to follow it.
* docs:
  If you find an error in the documentation, edit the appropriate markdown
  file in the "doc" folder.  (Don't worry about generating the man page.)

Contributors are listed in npm's `package.json` file.  You can view them
easily by doing `npm view npm contributors`.

If you would like to contribute, but don't know what to work on, check
the issues list or ask on the mailing list.

* <http://github.com/isaacs/npm/issues>
* <npm-@googlegroups.com>

## BUGS

When you find issues, please report them:

* web:
  <http://github.com/isaacs/npm/issues>
* email:
  <npm-@googlegroups.com>

Be sure to include *all* of the output from the npm command that didn't work
as expected.  The `npm-debug.log` file is also helpful to provide.

You can also look for isaacs in #node.js on irc://irc.freenode.net.  He
will no doubt tell you to put the output in a gist or email.

## HISTORY

See npm-changelog(3)

## AUTHOR

Isaac Z. Schlueter :: isaacs :: @izs :: <i@izs.me>
