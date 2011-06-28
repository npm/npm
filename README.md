# npm

This is just enough info to get you up and running.

Much more info available via `npm help` once it's installed.

## IMPORTANT

**You need node v0.4 or higher to run this program.**

To install an old **and unsupported** version of npm that works on node 0.3
and prior:

```bash
git clone git://github.com/isaacs/npm.git ./npm
cd npm
git checkout origin/0.2
make dev
```

## Simple Install

To install npm with one command, do this:

```bash
curl http://npmjs.org/install.sh | sh
```

To skip the npm 0.x cleanup, do this:

```bash
curl http://npmjs.org/install.sh | clean=no sh
```

To say "yes" to the 0.x cleanup, but skip the prompt:

```bash
curl http://npmjs.org/install.sh | clean=yes sh
```

If that fails, try this:

```bash
git clone http://github.com/isaacs/npm.git
cd npm
sudo make install
```

If you're sitting in the code folder reading this document in your
terminal, then you've already got the code.  Just do:

```bash
sudo make install
```

and npm will install itself.

If you don't have make, and don't have curl or git, and ALL you have is
this code and node, you can probably do this:

```bash
sudo node ./cli.js install -g
```

However, note that github tarballs **do not contain submodules**, so
those won't work.  You'll have to also fetch the appropriate submodules
listed in the .gitmodules file.

## Permissions

**tl;dr**

* Use `sudo` for greater safety.  Or don't, if you prefer not to.
* npm will downgrade permissions if it's root before running any build
  scripts that package authors specified.

### More details...

As of version 0.3, it is recommended to run npm as root.
This allows npm to change the user identifier to the `nobody` user prior
to running any package build or test commands.

If you are not the root user, or if you are on a platform that does not
support uid switching, then npm will not attempt to change the userid.

If you would like to ensure that npm **always** runs scripts as the
"nobody" user, and have it fail if it cannot downgrade permissions, then
set the following configuration param:

```bash
npm config set unsafe-perm false
```

This will prevent running in unsafe mode, even as non-root users.

## Uninstalling

So sad to see you go.

```bash
sudo npm uninstall npm -g
```

Or, if that fails,

```bash
sudo make uninstall
```

## More Severe Uninstalling

Usually, the above instructions are sufficient.  That will remove
npm, but leave behind anything you've installed.

If you would like to remove all the packages that you have installed,
then you can use the `npm ls` command to find them, and then `npm rm` to
remove them.

To remove cruft left behind by npm 0.x, you can use the included
`clean-old.sh` script file.  You can run it conveniently like this:

```bash
npm explore npm -g -- sh scripts/clean-old.sh
```

npm uses two configuration files, one for per-user configs, and another
for global (every-user) configs.  You can view them by doing:

```bash
npm config get userconfig   # defaults to ~/.npmrc
npm config get globalconfig # defaults to /usr/local/etc/npmrc
```

Uninstalling npm does not remove configuration files by default.  You
must remove them yourself manually if you want them gone.  Note that
this means that future npm installs will not remember the settings that
you have chosen.

## Using npm Programmatically

If you would like to use npm programmatically, you can do that.
It's not very well documented, but it *is* rather simple.

```javascript
var npm = require("npm")
npm.load(myConfigObject, function (er) {
  if (er) return handlError(er)
  npm.commands.install(["some", "args"], function (er, data) {
    if (er) return commandFailed(er)
    // command succeeded, and data might have some info
  })
  npm.on("log", function (message) { .... })
})
```

See `./bin/npm.js` for an example of pulling config values off of the
command line arguments using nopt.  You may also want to check out `npm
help config` to learn about all the options you can set there.

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
