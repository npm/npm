npm-developers(1) -- Developer Guide
====================================

## DESCRIPTION

So, you've decided to use npm to publish your project.

Fantastic!

There are a few things that you need to do above the simple steps
that your users will do to install your program.

## About These Documents

These are man pages.  If you install npm, you should be able to
then do `man npm-thing` to get the documentation on a particular
topic.

Any time you see "see npm-whatever(1)", you can do `man npm-whatever`
to get at the docs.

## The package.json File

You need to have a `package.json` file in the root of your project.

See npm-json(1) for details about what goes in that file.  At the very
least, you need:

* name:
  This should be a string that identifies your project.  Please do not
  use the name to specify that it runs on node, or is in JavaScript.
  You can use the "engines" field to explicitly state the versions of
  node (or whatever else) that your program requires, and it's pretty
  well assumed that it's javascript.
  
  It does not necessarily need to match your github repository name.
  
  So, `node-foo` and `bar-js` are bad names.  `foo` or `bar` are better.

* version:
  A semver-compatible version.

* engines:
  Specify the versions of node (or whatever else) that your program
  runs on.  The node API changes a lot, and there may be bugs or new
  functionality that you depend on.  Be explicit.

* author:
  Take some credit.

* scripts:
  If you have a special compilation or installation script, then you
  should put it in the `scripts` hash.  See npm-scripts(1).

* main:
  If you have a single module that serves as the entry point to your
  program (like what the "foo" package gives you at require("foo")),
  then you need to specify that in the "main" field.

## Make Sure Your Package Installs and Works

**This is important.**

If you can not install it locally, you'll have 
problems trying to publish it.  Or, worse yet, you'll be able to
publish it, but you'll be publishing a broken or pointless package.
So don't do that.

In the root of your package, do this:

    npm install .

That'll show you that it's working.  If you'd rather just create a symlink
package that points to your working directory, then do this:

    npm link .

Use `npm ls installed` to see if it's there.

Then go into the node-repl, and try using require() to bring in your module's
main and libs things.  Assuming that you have a package like this:

    node_foo/
      lib/
        foo.js
        bar.js

and you define your package.json with this in it:

    { "name" : "foo"
    , "directories" : { "lib" : "./lib" }
    , "main" : "./lib/foo"
    }

then you'd want to make sure that require("foo") and require("foo/bar") both
work and bring in the appropriate modules.

## Compile Node with OpenSSL

npm will stubbornly refuse to expose your password in the clear.  That
means that you'll have to install whatever package provides openssl.h
on your system.  When you `./configure` node, make sure that it says:

    Checking for openssl                     : yes

## Create a User Account

Create a user with the adduser command.  It works like this:

    npm adduser bob password bob@email.com

This is documented better in npm-adduser(1).  So do this to get the
details:

    man npm-adduser

## Publish your package

This part's easy.

    npm publish /path/to/my-package

You can give publish a url to a tarball, or a filename of a tarball,
or a path to a folder.  (Paths have to either be "." or contain a "/".)

## Tag your package as "stable"

This makes it easier to install without your users having to know the
version ahead of time.

    npm tag my-package@1.2.3 stable

You can also use other tags, but "stable" and "latest" have reserved
meanings.

## Brag about it

Send emails, write blogs, blab in IRC.

Tell the world how easy it is to install your program!

