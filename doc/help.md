npm-help(1) -- Get help about npm commands
==========================================

## SYNOPSIS

    npm help <section>

## DESCRIPTION

`<section>` is one of:
activate
adduser
build
bundle
cache
coding-style
config
deactivate
developers
folders
future-ideas/deploy
future-ideas/remote
future-ideas/site
help
install
json
link
list
ln
ls
npm
owner
publish
rebuild
restart
rm
scripts
start
stop
tag
test
uninstall
unpublish
update
view

## 12-second Intro

You probably got npm because you want to install stuff.

Use `npm install blerg` to install the latest version of "blerg".  Check out
`npm help install` for more info.  It can do a lot of stuff.

Use the `npm ls` command to show everything that's available.  Looking for
express-related modules?  `npm ls express`.  Looking for the latest express?
`npm ls express latest`.  (The arguments are just simple greps.)  And of course,
`npm help ls` will tell you more.

Use `npm ls installed` to show everything you've installed.

## Where to go for help

Come bug isaacs in irc://freenode.net#node.js.  He'll ask you to copy the npm
output to a pastie or gist, and perhaps to post an issue if it's a new bug.

Failing that, report the issue:

* web:
  <http://github.com/isaacs/npm/issues>
* email:
  <npm-@googlegroups.com>

If you ask something that's answered by this doc, you may be told to RTFM.
So, save yourself some time and read it now.

## Configs

Use the `npm config` command to manage how npm does stuff and where it puts things.
It stores your configs in the `~/.npmrc` file.  Check `npm help config` for more
info on that, if you care.

You can override any config for just a single command by doing `--configname value`
on the command line.

## Developers

If you're using npm to develop and publish your code, check out the following topics:

* json:
  Make a package.json file.  The "json" help doc will tell you what to put in it.
* link:
  For linking your current working code into Node's path, so that you don't have to
  reinstall every time you make a change.  Use "npm link" to do this.
* install:
  It's a good idea to install things if you don't need the symbolic link.  Especially,
  installing other peoples code from the registry is done via "npm install".
* adduser:
  Use the `npm adduser` command to add a user account for the npm registry, or to
  authorize yourself on a new machine.  If you forget your password, send an email
  to <npm-@googlegroups.com> and we'll delete your account so you can recreate it.
* publish:
  Use the `npm publish` command to upload your code to the registry, so that other
  people can install it easily.

## Contributing

Patches welcome!

* code:
  Read through `npm help coding-style` if you plan to submit code.  You don't have to
  agree with it, but you do have to follow it.
* docs:
  If you find an error in the documentation, edit the appropriate markdown file in the
  "doc" folder.  If you have the "ronn" gem installed, then you can `make doc` to build
  the man page, but this is not necessary for your patch to be accepted.
* tests:
  The tests are pretty limited.  It would be great to perhaps use
  something like expresso or vows.

Contributors are listed in npm's `package.json` file.
