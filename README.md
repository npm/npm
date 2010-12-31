# npm

This is just enough info to get you up and running.

Much more info available via `npm help` once it's installed.

## IMPORTANT

You need node v0.2.3 or higher to run this program.

You shouldn't use sudo with it.

## Simple Install

To install npm with one command, do this:

    curl http://npmjs.org/install.sh | sh

If that fails, try this:

    git clone http://github.com/isaacs/npm.git
    cd npm
    make

If you're sitting in the code folder reading this document in your
terminal, then you've already got the code.  Just do:

    make

and npm will install itself.

If you don't have make, and don't have curl or git, and ALL you have is
this code and node, you can do:

    node ./cli.js install npm

## Permission Errors

If it dies with a "Permission Denied" or EACCESS error, then that probably
means that you are running node in a shared root-owned location.  You've
got options.

Using sudo with npm is Very Not Recommended.  Anyone can publish anything,
and package installations can run arbitrary scripts.

### Option 1: Take ownership

Don't do this if you don't know what it does!  If you have software in
/usr/local that depends on a specific ownership (such as MySQL), then it
might break if you change its ownership.  Be careful.  Unix does not
assume you don't know what you're doing!

This is convenient if you have a single-user machine.  Run this command
once, and never use sudo again to install stuff in /usr/local:

    sudo chown -R $USER /usr/local/{share/man,bin,lib/node}

You could also give your user permission to write into that directory by
making it group-writable and adding your user to the group that owns it.

### Option 2: Don't leave $HOME

Install node in `$HOME/local` and npm will default to living right alongside
it.  Follow the steps in this gist: <http://gist.github.com/579814>

### Option 3: Customize npm to your heart's content

Create and edit a file at `~/.npmrc`.  This is an ini-formatted file, which
you can use to set npm configs.  Do something like this to it:

    cat >>~/.npmrc <<NPMRC
    root = ~/.node_libraries
    binroot = ~/bin
    manroot = ~/share/man
    NPMRC

### Option 4: HOLY COW NOT RECOMMENDED!!

You *can* just use sudo all the time for everything, and ignore the incredibly
obnoxious warnings telling you that you're insane for doing this.

    # you must REALLY trust me to do this!
    curl http://npmjs.org/install.sh | sudo sh
    sudo npm ls
    sudo npm install please-pwn-my-machine-kthx

If this causes horrible things to happen, you can't say I didn't warn you over
and over again until everyone got sick of hearing about it and told me to shut
up already.

It is on the roadmap to make npm do a bunch of chown/setuid stuff when sudoed,
so eventually it'll actually be *safer* to run as root than as a user account,
but that's a refactor that is slowly progressing.

If you have feelings about sudo use and what it should imply, then please go add
some comments and thoughts on
[this issue](http://github.com/isaacs/npm/issues/issue/294).

## More Fancy Installing

First, get the code.  Maybe use git for this.  That'd be cool.  Very fancy.

The default make target is `install`, which downloads the current stable
version of npm, and installs that for you.

If you want to install the exact code that you're looking at, the bleeding-edge
master branch, do this:

    make dev

If you'd prefer to just symlink in the current code so you can hack
on it, you can do this:

    make link

If you check out the Makefile, you'll see that these are just running npm commands
at the cli.js script directly.  You can also use npm without ever installing
it by using `node cli.js` instead of "npm".  Set up an alias if you want, that's
fine.  (You'll still need read permission to the root/binroot/manroot folders,
but at this point, you probably grok all that anyway.)

## Uninstalling

So sad to see you go.

    npm uninstall npm

Or, if that fails,

    make uninstall

## Using npm Programmatically

If you would like to use npm programmatically, you can do that as of
version 0.2.6.  It's not very well documented, but it IS rather simple.

    var npm = require("npm")
    npm.load(myConfigObject, function (er) {
      if (er) return handlError(er)
      npm.commands.install(["some", "args"], function (er, data) {
        if (er) return commandFailed(er)
        // command succeeded, and data might have some info
      })
      npm.on("log", function (message) { .... })
    })

See `./cli.js` for an example of pulling config values off of the
command line arguments.  You may also want to check out `npm help
config` to learn about all the options you can set there.

As more features are added for programmatic access to the npm library,
this section will likely be split out into its own documentation page.

## More Docs

Check out the [docs](http://github.com/isaacs/npm/blob/master/doc/),
especially the
[faq](http://github.com/isaacs/npm/blob/master/doc/faq.md#readme).

You can use the `npm help` command to read any of them.

If you're a developer, and you want to use npm to publish your program,
you should
[read this](http://github.com/isaacs/npm/blob/master/doc/developers.md#readme)
