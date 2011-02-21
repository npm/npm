# npm

This is just enough info to get you up and running.

Much more info available via `npm help` once it's installed.

## IMPORTANT

**You need node v0.4 or higher to run this program.**

To install on older versions of node, do the following:

    git clone git://github.com/isaacs/npm.git ./npm
    cd npm
    git checkout origin/0.2
    make dev

## Simple Install

To install npm with one command, do this:

    curl http://npmjs.org/install.sh | sh

If that fails, try this:

    git clone http://github.com/isaacs/npm.git
    cd npm
    sudo make install

If you're sitting in the code folder reading this document in your
terminal, then you've already got the code.  Just do:

    sudo make install

and npm will install itself.

If you don't have make, and don't have curl or git, and ALL you have is
this code and node, you can do:

    sudo node ./cli.js install npm

## Permissions

**tl;dr**

* Use `sudo` for greater safety.
* To enforce this added safety, do `npm config set unsafe-perm false`,
  or add `--no-unsafe` to the command line.
* npm will downgrade permissions if it's root before running any build
  scripts that package authors specified.
* If you were fine before, you can safely ignore this change.

### More details...

As of version 0.3, it is recommended to run some npm commands as root.
This allows npm to change the user identifier to the `nobody` user prior
to running any package build or test commands.

If this user id switch fails (generally because you are not the root
user) then the command will fail.

If you would prefer to run npm as your own user, giving package scripts
the same rights that your user account enjoys, then you may do so by
setting the `unsafe-perm` config value to `true`:

    npm config set unsafe-perm true

or simply by setting the `--unsafe` flag to any individual command:

    npm test express --unsafe


Note that root/sudo access is only required when npm is doing the
following actions:

1. Writing files and folders to the root.
2. Running package lifecycle scripts (generally to either build or
   test).

If you run npm without root privileges, and it doesn't have to do either
of these things, then no error will occur.

npm will automatically attempt to escalate permissions (generally by
prompting for your password) if it attempts to *remove* a file and fails
with an EPERM or EACCES error.  No other permission escalation is
attempted.

This is a departure from npm's history, and comes at long last.

## More Fancy Installing

First, get the code.  Maybe use git for this.  That'd be cool.  Very fancy.

The default make target is `install`, which downloads the current stable
version of npm, and installs that for you.

If you want to install the exact code that you're looking at, the bleeding-edge
master branch, do this:

    sudo make dev

If you'd prefer to just symlink in the current code so you can hack
on it, you can do this:

    sudo make link

If you check out the Makefile, you'll see that these are just running npm commands
at the cli.js script directly.  You can also use npm without ever installing
it by using `node cli.js` instead of "npm".  Set up an alias if you want, that's
fine.  (You'll still need read permission to the root/binroot/manroot folders,
but at this point, you probably grok all that anyway.)

## Uninstalling

So sad to see you go.

    sudo npm uninstall npm

Or, if that fails,

    sudo make uninstall

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
