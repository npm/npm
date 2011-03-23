npm-faq(1) -- Frequently Asked Questions
========================================

## Where can I find these docs in HTML?

<https://github.com/isaacs/npm/tree/master/doc>

## It didn't work.

That's not really a question.

## Why didn't it work?

I don't know yet.

Read the error output, and if you can't figure out what it means,
do what it says and post a bug with all the information it asks for.

## Where does npm put stuff?

See `npm help folders`

tl;dr:

* Use the `npm root` command to see where modules go, and the `npm bin`
  command to see where executables go
* Global installs are different from local installs.  If you install
  something with the `-g` flag, then its executables go in `npm bin -g`
  and its modules go in `npm root -g`.

## I installed something globally, but I can't `require()` it

Install it locally.

## I don't wanna.

Ok, then do this:

    echo 'export NODE_PATH="'$(npm root -g)'"' >> ~/.bashrc
    . ~/.bashrc

## How do I list installed packages?

`npm ls`

## How do I search for packages?

`npm search`

Arguments are greps.  `npm ls jsdom` shows jsdom packages.

## How do I update npm?

**NOTE**: This is the release candidate documentation.  To update to the
newer 1.0 release candidate, do this:

    npm install npm@rc -g

Once 1.0 is stable, do this:

    npm update npm -g

You can also update all outdated local packages by doing `npm update` without
any arguments, or global packages by doing `npm update -g`.

## What is a `package`?

A package is:

* a) a folder containing a program described by a package.json file
* b) a gzipped tarball containing (a)
* c) a url that resolves to (b)
* d) a `<name>@<version>` that is published on the registry with (c)
* e) a `<name>@<tag>` that points to (d)
* f) a `<name>` that has a "latest" tag satisfying (e)

Even if you never publish your package, you can still get a lot of
benefits of using npm if you just want to write a node program (a), and
perhaps if you also want to be able to easily install it elsewhere
after packing it up into a tarball (b).

## How do I install node with npm?

You don't.  Try one of these:

* <http://github.com/isaacs/nave>
* <http://github.com/visionmedia/n>
* <http://github.com/creationix/nvm>

## How can I use npm for development?

See `npm help developers` and `npm help json`.

You'll most likely want to `npm link` your development folder.  That's
awesomely handy.

## Can I list a url as a dependency?

Yes.  It should be a url to a gzipped tarball containing a single folder
that has a package.json in its root.  (See "what is a package?" above.)

## OK, but can I list a git repo as a dependency?

No.

Source repositories change quickly.  That is their purpose.  Whatever
you bundle into your package is your business, but having the registry
refer to a git URL as a "dependency" defeats the whole purpose.

It's possible that something a bit more snazzy will be developed at some
point in the future, but not likely.  The current system allows for a
lot of use cases, and is very easy to maintain.

If you really really want to have the latest checkout in your program,
you can clone the git repo, and then `npm link` it, and then `npm link
<name>` in any packages that use it to install the link locally to that
package.

## How do I symlink to a dev folder so that I don't have to keep re-installing?

See `npm help link`

## The package registry website.  What is that exactly?

See `npm help registry` for more info, or just visit
<http://github.com/isaacs/npmjs.org>.

## What's up with the insecure channel warnings?

As of this writing, node has problems uploading files over HTTPS.  That
means that publishes go over HTTP.

Until the problem is solved, npm will complain about being insecure.
The warnings will disappear when node supports uploading tarballs over
https reliably.

## I forgot my password, and can't publish.  How do I reset it?

Go to <http://admin.npmjs.org/> to reset it.

## I get ECONNREFUSED a lot.  What's up?

Either the registry is down, or node's DNS isn't able to reach out.
This happens a lot if you don't follow *all* the steps in the Cygwin
setup doc.

To check if the registry is down, open up
<http://registry.npmjs.org/-/short>
in a web browser.  This will also tell you if you are just unable to
access the internet for some reason.

If the registry IS down, let me know by emailing <i@izs.me>.  I'll have
someone kick it or something.

## Who does npm?

`npm view npm author`

`npm view npm contributors`

## I have a question or request not addressed here. Where should I put it?

Discuss it on the mailing list, or post an issue.

* <npm-@googlegroups.com>
* <http://github.com/isaacs/npm/issues>

## Why does npm hate me?

npm is not capable of hatred.  It loves everyone, especially you.
