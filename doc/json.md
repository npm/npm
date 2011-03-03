npm-json(1) -- Specifics of npm's package.json handling
=======================================================

## DESCRIPTION

npm aims to implement the commonjs
[Packages](http://wiki.commonjs.org/wiki/Packages/1.0) spec. However, some
adjustments have been made, which may eventually be unmade, but hopefully will
be incorporated into the spec.

This document is all you need to know about what's required in your package.json
file.

A lot of the behavior described in this document is affected by the config
settings described in `npm help config`.

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

Version must be [semver](https://github.com/isaacs/semver)-compliant.
npm assumes that you've
read the semver page, and that you comply with it.

Here's how it deviates from what's on semver.org:

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

## description

Put a description in it.  It's a string.  This helps people discover your
package, as it's listed in `npm ls`.

## keywords

Put keywords in it.  It's an array of strings.  This helps people
discover your package as it's listed in `npm ls`.

## homepage

The url to the project homepage.

**NOTE**: This is *not* the same as "url".  If you put a "url" field,
then the registry will think it's a redirection to your package that has
been published somewhere else, and spit at you.

Literally.  Spit.  I'm so not kidding.

## people fields: author, contributors

The "author" is one person.  "contributors" is an array of people.  A "person"
is an object with a "name" field and optionally "url" and "email", like this:

    { "name" : "Barney Rubble"
    , "email" : "b@rubble.com"
    , "url" : "http://barnyrubble.tumblr.com/"
    }

Or you can shorten that all into a single string, and npm will parse it for you:

    "Barney Rubble <b@rubble.com> (http://barnyrubble.tumblr.com/)

Both email and url are optional either way.

npm also sets a top-level "maintainers" field with your npm user info.

## files

The "files" field is an array of files to include in your project.  If
you name a folder in the array, then it will also include the files
inside that folder.  The default is just `[""]` which includes the
entire package folder in the tarball, but you may want to only include
specific things.

If you specify bins or man pages, then those will be
automatically added to the files array, even if they would not
ordinarily be included.

You can also provide a ".npmignore" file in the root of your package,
which will keep files from being included, even if they would be picked
up by the files array.

## main

The main field is a module ID that is the primary entry point to your program.
That is, if your package is named `foo`, and a user installs it, and then does
`require("foo")`, then your main module's exports object will be returned.

This should be a module ID relative to the root of your package folder.

For most modules, it makes the most sense to have a main script and often not
much else.

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

Notice that if the executable file is interpreted by node (i.e., specifying
node in the shebang line), npm actually installs a shim instead of symlinking
it, which causes expressions `require.main === module` and `module.id === "."`
evaluate to `false` within the file. This seems unable to be resolved until
node provides a "flexible `require()`".

Shortcut: If you have a single executable, and its name is already what you
want it to be, then you can just supply it as a string.  For example:

    { "bin" : "./path/to/program" }

would be the same as this:

    { "bin" : { "program" : "./path/to/program" } }

## man

Specify either a single file or an array of filenames to put in place for the
`man` program to find.

If only a single file is provided, then it's installed such that it is the
result from `man <pkgname>`, regardless of its actual filename.  For example:

    { "name" : "foo"
    , "man" : "./man/doc.1"
    }

would link the `./man/doc.1` file in such that it is the target for `man foo`

If the filename doesn't start with the package name, then it's prefixed.
So, this:

    { "name" : "foo"
    , "man" : [ "./man/foo.1", "./man/bar.1" ]
    }

will create files to do `man foo` and `man foo-bar`.

Man files must end with a number, and optionally a `.gz` suffix if they are
compressed.  The number dictates which man section the file is installed into.

    { "name" : "foo"
    , "man" : [ "./man/foo.1", "./man/foo.2" ]
    }

will create entries for `man foo` and `man 2 foo`

## directories

The CommonJS [Packages](http://wiki.commonjs.org/wiki/Packages/1.0) spec details a
few ways that you can indicate the structure of your package using a `directories`
hash. If you look at [npm's package.json](http://registry.npmjs.org/npm/latest),
you'll see that it has directories for doc, lib, and man.

In the future, this information may be used in other creative ways.

### directories.lib

If you specify a "lib" directory, then the lib
folder will be walked and any *.js or *.node files found will be exposed as a
default module hash.

**The lib directory mapping will be deprecated soon. Please do not rely
on it.**

### directories.bin

If you specify a "bin" directory, then all the files in that folder will be used
as the "bin" hash.

If you have a "bin" hash already, then this has no effect.

### directories.man

A folder that is full of man pages.  Sugar to generate a "man" array by walking the folder.

### directories.doc

Put markdown files in here.  Eventually, these will be displayed nicely, maybe, someday.

### directories.example

Put example scripts in here.  Someday, it might be exposed in some clever way.

## repository

Specify the place where your code lives. This is helpful for people who want to
contribute, as well as perhaps maybe being the underpinning of some magical "track
this package on git" feature someday maybe if somebody wants to write it ever.

Do it like this:

    "repository" :
      { "type" : "git"
      , "url" : "http://github.com/isaacs/npm.git"
      }

    "repository" :
      { "type" : "svn"
      , "url" : "http://v8.googlecode.com/svn/trunk/"
      }

The URL should be a publicly available (perhaps read-only) url that can be handed
directly to a VCS program without any modification.  It should not be a url to an
html project page that you put in your browser.  It's for computers.

Here are some examples of Doing It Wrong:

    WRONG!
    "repository" :
      { "type" : "git"
      , "url" : "git@github.com:isaacs/npm.git" <-- THIS IS PRIVATE!
      }
    
    ALSO WRONG!
    "repository" :
      { "type" : "git"
      , "url" : "http://github.com/isaacs/npm" <-- THIS IS WEBPAGE!
      }

    This is ok, but completely unnecessary:
    "repository" :
      { "type" : "git"
      , "url" : "http://github.com/isaacs/npm.git"
      , "private" : "git@github.com:isaacs/npm.git"
      , "web" : "http://github.com/isaacs/npm"
      }

## scripts

The "scripts" member is an object hash of script commands that are run
at various times in the lifecycle of your package.  The key is the lifecycle
event, and the value is the command to run at that point.

See `npm help scripts` to find out more about writing package scripts.

## config

A "config" hash can be used to set configuration
parameters used in package scripts that persist across upgrades.  For
instance, if a package had the following:

    { "name" : "foo"
    , "config" : { "port" : "8080" } }

and then had a "start" command that then referenced the
`npm_package_config_port` environment variable, then the user could
override that by doing `npm config set foo:port 8001`.

See `npm help config` and `npm help scripts` for more on package
configs.

## dependencies

Dependencies are specified with a simple hash of package name to version
range. The version range is EITHER a string which has one or more
space-separated descriptors, OR a range like "fromVersion - toVersion"

**Please do not put test harnesses in your `dependencies` hash.**  See
`devDependencies`, below.

Version range descriptors may be any of the following styles, where "version"
is a semver compatible version identifier.

* `version` Must match `version` exactly
* `=version` Same as just `version`
* `>version` Must be greater than `version`
* `>=version` etc
* `<version`
* `<=version`
* `~version` See 'Tilde Version Ranges' below
* `1.2.x` See 'X Version Ranges' below
* `http://...` See 'URLs as Dependencies' below
* `*` Matches any version
* `""` (just an empty string) Same as `*`
* `version1 - version2` Same as `>=version1 <=version2`.
* `range1 || range2` Passes if either range1 or range2 are satisfied.

For example, these are all valid:

    { "dependencies" :
      { "foo" : "1.0.0 - 2.9999.9999"
      , "bar" : ">=1.0.2 <2.1.2"
      , "baz" : ">1.0.2 <=2.3.4"
      , "boo" : "2.0.1"
      , "qux" : "<1.0.0 || >=2.3.1 <2.4.5 || >=2.5.2 <3.0.0"
      , "asd" : "http://asdf.com/asdf.tar.gz"
      , "til" : "~1.2"
      , "elf" : "~1.2.3"
      , "two" : "2.x"
      , "thr" : "3.3.x"
      }
    }

### Tilde Version Ranges

A range specifier starting with a tilde `~` character is matched against
a version in the following fashion.

* The version must be at least as high as the range.
* The version must be less than the next major revision above the range.

For example, the following are equivalent:

* `"~1.2.3" = ">=1.2.3 <1.3.0"`
* `"~1.2" = ">=1.2.0 <2.0.0"`
* `"~1" = ">=1.0.0 <2.0.0"`

### X Version Ranges

An "x" in a version range specifies that the version number must start
with the supplied digits, but any digit may be used in place of the x.

The following are equivalent:

* `"1.2.x" = ">=1.2.0 <1.3.0"`
* `"1.x.x" = ">=1.0.0 <2.0.0"`
* `"1.2" = "1.2.x"`
* `"1.x" = "1.x.x"`
* `"1" = "1.x.x"`

You may not supply a comparator with a version containing an x.  Any
digits after the first "x" are ignored.

### URLs as Dependencies

Starting with npm version 0.2.14, you may specify a tarball URL in place
of a version range.

This tarball will be downloaded and installed as a bundle at install
time.  See `npm help bundle`

## devDependencies

If someone is planning on downloading and using your module in their
program, then they probably don't want or need to download and build
the external test or documentation framework that you use.

In this case, it's best to list these additional items in a
`devDependencies` hash.

These things will be installed whenever the `--dev` configuration flag
is set.  This flag is set automatically when doing `npm link`, and can
be managed like any other npm configuration param.  See `npm help
config` for more on the topic.

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
