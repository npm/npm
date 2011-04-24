# npm

This is just enough info to get you up and running.

Much more info available via `npm help` once it's installed.

## RELEASE CANDIDATE

The master branch contains the latest release candidate, which as of
this time is 1.0.something.  If you want version 0.2 or 0.3, then you'll
need to check those branches out explicitly.

The "latest" on the registry is 0.3, because 1.0 is not yet stable.

It will be the default install target at the end of April, 2011.

## IMPORTANT

**You need node v0.4 or higher to run this program.**

To install an old **and unsupported** version of npm that works on node 0.3
and prior:

    git clone git://github.com/isaacs/npm.git ./npm
    cd npm
    git checkout origin/0.2
    make dev

## Simple Install

To install npm with one command, do this:

    curl http://npmjs.org/install.sh | npm_install=rc sh

If that fails, try this:

    git clone http://github.com/isaacs/npm.git
    cd npm
    sudo make install

If you're sitting in the code folder reading this document in your
terminal, then you've already got the code.  Just do:

    sudo make install

and npm will install itself.

If you don't have make, and don't have curl or git, and ALL you have is
this code and node, you can probably do this:

    sudo node ./cli.js install -g

However, note that github tarballs **do not contain submodules**, so
those won't work.  You'll have to also fetch the appropriate submodules
listed in the .gitmodules file.

## Permissions

**tl;dr**

* Use `sudo` for greater safety.  Or don't.
* npm will downgrade permissions if it's root before running any build
  scripts that package authors specified.

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

    sudo npm uninstall npm -g

Or, if that fails,

    sudo make uninstall

## More Severe Uninstalling

Usually, the above instructions are sufficient.  That will remove
npm, but leave behind anything you've installed.

If that doesn't work, or if you require more drastic measures,
continue reading.

This assumes that you installed node and npm in the default place.  If
you configured node with a different `--prefix`, or installed npm with a
different prefix setting, then adjust the paths accordingly, replacing
`/usr/local` with your install prefix.

   rm -rf /usr/local/{lib/node,lib/node/.npm,bin,share/man}/npm*

If you installed things *with* npm, then your best bet is to uninstall
them with npm first, and then install them again once you have a
proper install.  This can help find any symlinks that are lying
around:

   ls -laF /usr/local/{lib/node,lib/node/.npm,bin,share/man} | grep npm

Prior to version 0.3, npm used shim files for executables and node
modules.  To track those down, you can do the following:

   find /usr/local/{lib/node,bin} -exec grep -l npm \{\} \; ;

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

## Legal Stuff

"npm" and "the npm registry" are owned by Isaac Z. Schlueter.  All
rights not explicitly granted in the MIT license are reserved. See the
included LICENSE file for more details.

"Node.js" and "node" are trademarks owned by Joyent, Inc.  npm is not
officially part of the Node.js project, and is neither owned by nor
officially affiliated with Joyent, Inc.

The packages in the npm registry are not part of npm itself, and are the
sole property of their respective maintainers.  While every effort is
made to ensure accountability, there is absolutely no guarantee,
warrantee, or assertion made as to the quality, fitness for a specific
purpose, or lack of malice in any given npm package.  Modules
published on the npm registry are not affiliated with or endorsed by
Joyent, Inc., Isaac Z. Schlueter, Ryan Dahl, or the Node.js project.

If you have a complaint about a package in the npm registry, and cannot
resolve it with the package owner, please express your concerns to
Isaac Z. Schlueter at <i@izs.me>.

### In plain english

This is mine; not my employer's, not Node's, not Joyent's, not Ryan
Dahl's.

If you publish something, it's yours, and you are solely accountable
for it.  Not me, not Node, not Joyent, not Ryan Dahl.

If other people publish something, it's theirs.  Not mine, not Node's,
not Joyent's, not Ryan Dahl's.

Yes, you can publish something evil.  It will be removed promptly if
reported, and we'll lose respect for you.  But there is no vetting
process for published modules.

If this concerns you, inspect the source before using packages.
