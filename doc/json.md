npm-json(1) -- Specifics of npm's package.json handling
=======================================================

## DESCRIPTION

npm aims to implement the commonjs
[Packages](http://wiki.commonjs.org/wiki/Packages/1.0) spec. However, some
adjustments have been made, which may eventually be unmade, but hopefully will
be incorporated into the spec.

## overlay

npm responds to the `node` and `npm` env-specific package.json values, which
you can hang on any of the following keys: `"overlay", "env", "context",
"ctx", "vnd", "vendor"`.

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

## version

Version must be [semver](http://semver.org)-compliant. npm assumes that you've
read the semver page, and that you comply with it. Versions packages with
non-semver versions will not be installed by npm. It's just too tricky if you
have more than one way to do it, and semver works well.

(This is actually mentioned in the Packages/1.0 spec, but it's worth
mentioning that npm enforces this requirement quite strictly, since it's
pretty liberal about most other things.)

## dependencies

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

(props to [mikeal](http://github.com/mikeal) for the idea)
