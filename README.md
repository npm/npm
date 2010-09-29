# npm

This is just enough info to get you up and running.

More info available via `npm help` once it's installed.

## IMPORTANT

You need node v0.2.0 or higher to run this program.

You shouldn't use sudo with it.

## Simple Install

To install npm, do this:

    curl http://npmjs.org/install.sh | sh

## Permission Errors

If it dies with a "Permission Denied" or EACCESS error, then that probably
means that you are running node in a shared root-owned location.  You've
got options.

Using sudo with npm is Very Not Recommended.  Anyone can publish anything,
and package installations can run arbitrary scripts.

### Option 1: Take ownership

This is good if you have a single-user machine.  Run this command once, and
never use sudo again to install stuff in /usr/local:

    sudo chown -R $USER /usr/local

You could also give your user permission to write into that directory by
making it group-writable and adding your user to the group that owns it.

### Option 2: Don't leave $HOME

Install node in `$HOME/local` and npm will default to living right alongside
it.  Follow the steps in this gist: <http://gist.github.com/579814>

### Option 3: Customize npm to your heart's content

Create and edit a file at `~/.npmrc`.  This is an ini-formatted file, which
you can use to set npm configs.  Do something like this to it:

    cat >>~/.npmrc <<NPMRC
    root = $HOME/.node_libraries
    binroot = $HOME/bin
    manroot = $HOME/share/man
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

## Install Problems

There's was an issue prior to npm version 0.2.0 where packages whose names contained
hyphen characters would be odd.

If you've installed any packages with `-` in the name prior to 0.2.0, then you ought
to remove and reinstall them.

## More Docs

Check out the [docs](http://github.com/isaacs/npm/blob/master/doc/).

You can use the [npm help](http://github.com/isaacs/npm/blob/master/doc/help.md#readme)
command to read any of them.

If you're a developer, and you want to use npm to publish your program,
you should
[read this](http://github.com/isaacs/npm/blob/master/doc/developers.md#readme)
