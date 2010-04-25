npm(1) -- node package manager
==============================

## DESCRIPTION

npm is a little package manager for the Node javascript library.

## Installing

To install npm, do this:

    make install

If you get any complaints, try

    sudo make install

That will use npm to install itself, like
[Ouroboros](http://en.wikipedia.org/wiki/Ouroboros). From there, you can call
the command line program `npm`, and read this file by doing `man npm`.

Try `npm help` for more information.

## Status: alpha

This thing is a baby yet. But these kids grow up before you know it! Pretty
soon, you'll be all tapping out your pipe on the front porch, saying in your
withered old man voice, ***"I remember back before the war with the machines,
when that npm thing couldn't even install itself, and didn't know what a
version was. We used promises for everything and the global object was called
node. Movies were a nickel when we downloaded them from from the micro
torrents, and soda pop had corn syrup of the highest fructose imaginable. You
youngins don't know how good you got it."***

This isn't even beta, it's alpha. When most of the core functionality is
working, I'll make an announcement on the
[node.js](http://groups.google.com/group/nodejs) list. That'll be the `0.1.0`
version.

Here's what I mean by "core functionality":

1. Install packages by name, and get the stable version.
2. Install packages by supplying a name and version, and get the version
   specified.
3. Install more than one package at a time by specifying them all on the
   command line.
4. Install pre-requisites automatically, pulling the stable versions of the
   dependencies.
5. Talk to a centralized repository to do all this package/version lookup
   magic.
6. Install more than one version of a package, and optionally select an
   "active" version. (this works now)
7. Safely uninstall packages, not removing them unless they have no dependents.
   (Override with a `--force` flag, of course.) (this works mostly, minus the
   `--force` bit.)
8. Provide a utility for uploading a package.json to a js-registry repository.
   (totally works now. check out `npm publish <tarball-url>`.)
9. Handle circular dependencies nicely.
10. Install and activate automatically. (works now)
11. Be much smarter about cli arguments.
12. Help topics.
13. Install a "link" to a dev directory, so that it links it in rather than
    doing the moveIntoPlace step. (works)
14. Detect when a package has only been installed as a dependency, and be able
    to remove it when nothing else depends on it.

## Principles

Put the files where they need to be so that node can find them using the
methods it already uses.

Be easy, not clever.

The file system is the database.

Sync with the habits that are already in use.

Packages should be maintained by their authors, not by the package manager
author. (Especially if that's me, because I'm lazy.)

Run it on node. Cuz a node package manager should be written in evented
javascript.

## Contributing

If you're interested in helping, that's awesome! Please fork this project,
implement some of the things on the list, and then let me know. You can
usually find me in #node.js on freenode.net, or you can reach me via
<i@izs.me>.

If you don't want to contribute code, that's also cool.  It's very helpful
to have people play with npm and send issues or complaints.  It's stable in
what it does, so you may find it useful even if you just link in your stuff
by doing `npm link .` to put it in the `NODE_PATH` so you can pull it in
more easily.

If you have strong feelings about package managers, I'd love to hear your
opinions.


## What works now:

These are the commands that actually do things, as of today. If they don't do
what they say they do, then please [post an issue](http://github.com/isaacs/npm/issues)
about it.

## Package Lifecycle Scripts

npm supports the "scripts" member of the package.json script, for the
following scripts:

`preinstall` - Run BEFORE the package is installed

`install` - Run AFTER the package is installed.

`preactivate` - Run BEFORE the package is activated.

`activate` - Run AFTER the package has been activated.

`deactivate` - Run BEFORE the package is deactivated.

`postdeactivate` - Run AFTER the package is deactivated.

`uninstall` - Run BEFORE the package is uninstalled.

`postuninstall` - Run AFTER the package is uninstalled.

### Package Lifecycle Env Vars

Package scripts are run in an environment where the package.json fields have
been tacked onto the `npm_package_` prefix. So, for instance, if you had
`{"name":"foo", "version":"1.2.5"}` in your package.json file, then in your
various lifecycle scripts, this would be true:

    process.env.npm_package_name === "foo"
    process.env.npm_package_version === "1.2.5"

Objects are flattened following this format, so if you had
`{"scripts":{"install":"foo.js"}}` in your package.json, then you'd see this
in the script:

    process.env.npm_package_scripts_install = "foo.js"

Last but not least, the `npm_lifecycle_event` environment variable is set to
whichever stage of the cycle is being executed. So, you could have a single
script used for different parts of the process which switches based on what's
currently happening.

If the script exits with a code other than 0, then this will abort the
process.

Note that these script files don't have to be nodejs or even javascript
programs. They just have to be some kind of executable file.

For example, if your package.json contains this:

    { "scripts" :
      { "install" : "scripts/install.js"
      , "postinstall" : "scripts/install.js"
      , "activate" : "scripts/install.js"
      , "uninstall" : "scripts/uninstall.js"
      }
    }

then the `scripts/install.js` will be called for the install, post-install,
and activate stages of the lifecycle, and the `scripts/uninstall.js` would be
called when the package is uninstalled.  Since `scripts/install.js` is running
for three different phases, it would be wise in this case to look at the
`npm_lifecycle_event` environment variable.

If you want to run a make command, you can do so.  This works just fine:

    { "scripts" :
      { "preinstall" : "./configure"
      , "install" : "make"
      , "test" : "make test"
      }
    }

However, the script line is not simply a command line, so `make && make install`
would try to execute the `make` command with the arguments `&&`, `make`, and
`install`.  If you have a lot of stuff to run in a command, put it in a script
file.

## Deviations from and Extensions to the Packages/1.0 Spec

npm aims to implement the commonjs
[Packages](http://wiki.commonjs.org/wiki/Packages/1.0) spec. However, some
adjustments have been made, which may eventually be unmade, but hopefully will
be incorporated into the spec.

npm responds to the `node` and `npm` env-specific package.json values, which
you can hang on any of the following keys: `"overlay", "env", "context",
"ctx", "vnd", "vendor"`.

For example:

    { "name" : "foo"
    , "version" : 7
    , "description" : "generic description"
    , "vnd" :
      { "node" :
        { "name" : "bar"
        , "description" : "description for node"
        }
      , "npm" :
        { "version" : "1.0.7"
        , "description" : "description for npm"
        }
      , "narwhal" :
        { "description" : "description for narwhal" }
      }
    }

In this case, this is what npm will treat it as:

    { "name" : "bar"
    , "version" : "1.0.7"
    , "description" : "description for npm"
    }

This way, even if npm is not exactly the same as some other package management
system, you can still use both, and it can be a happy planet.

### version

Version must be [semver](http://semver.org)-compliant. npm assumes that you've
read the semver page, and that you comply with it. Versions packages with
non-semver versions will not be installed by npm. It's just too tricky if you
have more than one way to do it, and semver works well.

(This is actually mentioned in the Packages/1.0 spec, but it's worth
mentioning that npm enforces this requirement quite strictly, since it's
pretty liberal about most other things.)

### dependencies

The Packages/1.0 spec's method for specifying dependencies is Unclean in My
Sight. So, npm is using a very simple semver-based method.

Dependencies are specified with a simple hash of package name to version
range. The version range is EITHER a string with has one or more
space-separated descriptors.

Version range descriptors may be any of the following styles, where "version"
is a semver compatible version identifier.

1. `version` Must match `version` exactly
2. `=version` Same as just `version`
3. `>version` Must be greater than `version`
4. `>=version` etc
5. `<version`
6. `<=version`
7. `*` Matches any version
8. `""` (just an empty string) Same as `*`
9. `version1 - version2` Same as `>=version1 <=version2`.

For example, these are all valid:

    { "dependencies" :
      { "foo" : "1.0.0 - 2.9999.9999"
      , "bar" : ">=1.0.2 <2.1.2"
      , "baz" : ">1.0.2 <=2.3.4"
      , "boo" : "2.0.1"
      }
    }

### link

You may specify a `link` member in your package.json to have npm link
dependencies in to a particular location inside your package dir. For example:

    { "dependencies" :
      { "boo" : "2.0.1"
      , "baz" : ">1.0.2 <=2.3.4"
      , "foo" : "1.0.0 - 2.9999.9999"
      , "bar" : ">=1.0.2 <2.1.2"
      }
    , "link" :
      { "boo" : "./deps/boo"
      , "baz" : "./lib/baz"
      , "foo" : "./deps/foo"
      , "bar" : "./deps/bar"
      }
    }

This would link the dependencies into the specified locations, so that the
package code could do `require("./deps/foo")` to import whichever version of
`foo` was satisfying the requirement.

<strong style="color:red">Warning!</strong> This is currently the *only* way
in which npm modifies the pristine nature of the package directory, and it may
go away eventually. It's just that it satisfies a use case that is pretty
tricky to do otherwise.

### engines

Packages/1.0 says that you can have an "engines" field with an array of engine
names. However, it has no provision for specifying which version of the engine
your stuff runs on.

With npm, you can use either of the following styles to specify the version of
node that your stuff works on:

    { "engines" : [ "node >=0.1.27 <0.1.30" ] }

or:

    { "engines" : { "node" : ">=0.1.27 <0.1.30" } }

And, like with dependencies, if you don't specify the version (or if you
specify "*" as the version), then any version of node will do.

If you specify an "engines" field, then npm will require that "node" be
somewhere on that list. If "engines" is omitted, then npm will just assume
that it works on node.

### bin

A lot of packages have one or more executable files that they'd like to
install into the PATH. npm makes this pretty easy (in fact, it uses this
feature to install the "npm" executable.)

To use this, supply a `bin` field in your package.json which is a map of
command name to local file name. On install, npm will link that file into
place right next to wherever node is installed. (Presumably, this is in your
PATH, and defaults to `/usr/local/bin`.) On activation, the versioned file
will get linked to the main filename (just like how the main.js stuff works,
but with an executable in the PATH.)

For example, npm has this:

    { "bin" : { "npm" : "./cli.js" } }

So, when you install npm, it'll create a symlink from the `cli.js` script to
`/usr/local/bin/npm-version`. Then, when you activate that version, it'll
create a symlink from `/usr/local/bin/npm-version` to `/usr/local/bin/npm`.

(props to [mikeal](http://github.com/mikeal) for the idea)

## Todo

All the "core functionality" stuff above.  Most immediately:

* Install packages from the registry.
* Install missing dependencies. For each one, fetch it, then figure out what
  it needs, then fetch that if we don't already have it, etc. Put off the
  resolveDependencies step until everything on the list has been installed,
  then go back and do the dependency linking.
* Uninstall dependent packages.
* Update dependencies when a new satisfying version is installed.
* Make the CLI not so user-hostile.

Some "nice to have" things that aren't quite core:

* Use path.relative so that the whole root can be picked up and moved easily.
* Specify the root (and other global options, perhaps) to the CLI.
* Parse command line options better, and pass an object to the npm command
  functions, rather than having everything just take one or two positional
  arguments.

## Version History

### 0.0.1

* Lots of sketches and false starts.  Abandoned a few times.

### 0.0.2

* Install worked mostly.  Still promise-based.

### 0.0.3

* Converted to callbacks.
* Mikeal Rogers wrote a registry for it.

### 0.0.4

* version dependencies
* link packages
* activation
* lifecycle scripts
* bin linking
* uninstallation

### 0.0.5

* fix a few bugs in uninstall wrt dependent packages
* fix relative require()for nodejs modules installed with the "bin" field.
  (issue #2)
* update to work with node 0.1.33 (aka net2)
* added publish and tag commands

### 0.0.6

* set up a public registry
* send content-length with registry PUTs
* adduser command (Mikeal Rogers)
* ini file stuff (Mikeal Rogers)
* env-specific package.json
* added more info to npm's the package.json (bugs, contributors, etc.)

### 0.0.7

* fixed a bug in semver
