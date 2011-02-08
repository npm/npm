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

If there doesn't seem to be enough output for your liking, run the
command with `--loglevel verbose` or if you're really brave, `--loglevel
silly`.

## How do I make npm less noisy?

`npm config set loglevel error`

You can also set it to `win` or `silent` for even more quietness.

## How do I list installed packages?

`npm ls installed`

If you just want to see the names, and not all the registry data, you
can do: `npm ls installed --no-registry` to turn off the registry.

## How do I search for packages?

`npm ls`

Arguments are greps.  `npm ls jsdom` shows jsdom packages.

## How do I update npm?

`npm update npm`

You can also update all outdated packages by doing `npm update` without
any arguments.

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
* <http://github.com/creationix/nvm>

## How can I use npm for development?

See `npm help developers` and `npm help json`.

You'll most likely want to `npm link` your development folder.  That's
awesomely handy.

## Can I list a url as a dependency?

No.

If you need to depend on something that isn't published, or a package
that is published, but which you've modified slightly, you can do this.

The correct way is to do the following:

* add a `"name":"version"` entry to your package.json file.
* `npm bundle install <pkg>` where `<pkg>` is a url or path to your
  custom unpublished package.

When installing your package, npm will skip over any dependencies that
are bundled.

## OK, but can I list a git repo as a dependency?

No.

Source repositories change quickly.  That is their purpose.  Whatever
you bundle into your package is your business, but having the registry
refer to a git URL as a "dependency" defeats the whole purpose.

It's possible that something a bit more snazzy will be developed at some
point in the future, but not likely.  The current system allows for a
lot of use cases, and is very easy to maintain.

## How do I symlink to a dev folder so that I don't have to keep re-installing?

`npm link`

## The package registry website.  What is that exactly?

See `npm help registry` for more info.

## What's up with the insecure channel warnings?

As of this writing, node has problems uploading files over HTTPS.  That
means that publishes go over HTTP.

Until the problem is solved, npm will complain about being insecure.
The warnings will disappear when node supports uploading tarballs over
https reliably.

## I forgot my password, and can't publish.  How do I reset it?

Email <i@izs.me> from the email address that you signed up with.  Then
wait a day or two maybe.

## I get ECONNREFUSED a lot.  What's up?

Either the registry is down, or node's DNS isn't able to reach out.
This happens a lot if you don't follow *all* the steps in the Cygwin
setup doc.

To check if the registry is down, open up <http://registry.npmjs.org/>
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
