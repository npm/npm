npm-json(1) -- Specifics of npm's package.json handling
=======================================================

## DESCRIPTION

npm aims to implement the commonjs
[Packages](http://wiki.commonjs.org/wiki/Packages/1.0) spec. However, some
adjustments have been made, which may eventually be unmade, but hopefully will
be incorporated into the spec.

This document is all you need to know about what's required in your package.json
file.

## name

The *most* important things in your package.json are the name and version fields.

The name is what your thing is called.  Some tips:

* Don't put "js" or "node" in the name.  It's assumed that it's js, since you're
  writing a package.json file, and you can specify the engine using the "engines"
  field.  (See below.)
* The name ends up being part of a URL, an argument on the command line, and a
  folder name. So, don't use characters that are annoying in those contexts, like
  funny UTF things or parentheses or slashes, or else it'll break.
* The name will probably be passed as an argument to require(), so it should
  be something short, but also reasonably descriptive.
* You may want to check the npm registry to see if there's something by that name
  already, before you get too attached to it.  http://registry.npmjs.org/

## version

The *most* important things in your package.json are the name and version fields.

Version must be [semver](http://semver.org)-compliant. npm assumes that you've
read the semver page, and that you comply with it.  Here's how it deviates from
what's on semver.org:

* Versions can start with "v"
* A numeric item separated from the main three-number version by a hyphen
  will be interpreted as a "build" number, and will *increase* the version.
  But, if the tag is not a number separated by a hyphen, then it's treated
  as a pre-release tag, and is *less than* the version without a tag.
  So, 0.1.2-7 > 0.1.2-6 > 0.1.2 > 0.1.2beta

This is a little bit confusing to explain, but matches what you see in practice
when people create tags in git like "v1.2.3" and then do "git describe" to generate
a patch version.  (This is how node's versions are generated, and has driven this
design.)

## main

The main field is a module ID that is the primary entry point to your program.
That is, if your package is named `foo`, and a user installs it, and then does
`require("foo")`, then your main module's exports object will be returned.

This should be a module ID relative to the root of your package folder.

For most modules, it makes the most sense to have a main script.

## directories

The "directories" member is an object hash of folders.

### directories.lib

The only directory that npm cares about is the "lib" directory.  This is a folder
that will be mapped to the package name.  So, if you had a package named `foo`,
and the package.json contains `"directories":{"lib":"./lib"}`, and there was
a file called `./lib/bar.js`, then require("foo/bar") would include that module.

This is handy if your package is a collection or library full of useful goodies.
However, dependency paths are not corrected for modules in the lib folder, so it's
a bit more complicated.

Most of the time, delving into a package's folder is not as awesome.

## scripts

The "scripts" member is an object hash of script commands that are run
at various times in the lifecycle of your package.  The key is the lifecycle
event, and the value is the command to run at that point.

See `npm help scripts` to find out more about writing package scripts.

## dependencies

Dependencies are specified with a simple hash of package name to version
range. The version range is EITHER a string with has one or more
space-separated descriptors.

Version range descriptors may be any of the following styles, where "version"
is a semver compatible version identifier.

* `version` Must match `version` exactly
* `=version` Same as just `version`
* `>version` Must be greater than `version`
* `>=version` etc
* `<version`
* `<=version`
* `*` Matches any version
* `""` (just an empty string) Same as `*`
* `version1 - version2` Same as `>=version1 <=version2`.

For example, these are all valid:

    { "dependencies" :
      { "foo" : "1.0.0 - 2.9999.9999"
      , "bar" : ">=1.0.2 <2.1.2"
      , "baz" : ">1.0.2 <=2.3.4"
      , "boo" : "2.0.1"
      }
    }

## link

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

## engines

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

## bin

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

## overlay

npm responds to the `node` and `npm` env-specific package.json values, which
you can hang on the "overlay" key.

For example:

    { "name" : "foo"
    , "version" : 7
    , "description" : "generic description"
    , "overlay" :
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
