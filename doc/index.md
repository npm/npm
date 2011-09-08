npm-index(1) -- Index of all npm documentation files
====================================================


## npm-adduser(1)

Create or verify a user named `<username>` in the npm registry, and
save the credentials to the `.npmrc` file.

## npm-bin(1)

Print the folder where npm will install executables.

## npm-build(1)

This is the plumbing command called by `npm link` and `npm install`.

## npm-bundle(1)

The `npm bundle` command has been removed in 1.0, for the simple reason
that it is no longer necessary, as the default behavior is now to
install packages into the local space.

## npm-cache(1)

Used to add, list, or clear the npm cache folder.

## npm-changelog(1)

A brief history.

## npm-coding-style(1)

npm's coding style is a bit unconventional.  It is not different for
difference's sake, but rather a carefully crafted style that is
designed to reduce visual clutter and make bugs more apparent.

## npm-completion(1)

Enables tab-completion in all npm commands.

## npm-config(1)

npm gets its configuration values from 5 sources, in this priority:

## npm-deprecate(1)

This command will update the npm registry entry for a package, providing
a deprecation warning to all who attempt to install it.

## npm-developers(1)

So, you've decided to use npm to develop (and maybe publish/deploy)
your project.

## npm-docs(1)

This command tries to guess at the likely location of a package's
documentation URL, and then tries to open it using the `--browser`
config param.

## npm-edit(1)

Opens the package folder in the default editor (or whatever you've
configured as the npm `editor` config -- see `npm-config(1)`.)

## npm-explore(1)

Spawn a subshell in the directory of the installed package specified.

## npm-faq(1)

Questions asked frequently.

## npm-folders(1)

npm puts various things on your computer.  That's its job.

## npm-help-search(1)

This command will search the npm markdown documentation files for the
terms provided, and then list the results, sorted by relevance.

## npm-help(1)

If supplied a topic, then show the appropriate documentation page.

## npm-init(1)

This will ask you a bunch of questions, and then write a package.json for you.

## npm-install(1)

This command installs a package, and any packages that it depends on.

## npm-json(1)

This document is all you need to know about what's required in your package.json
file.  It must be actual JSON, not just a JavaScript object literal.

## npm-link(1)

Package linking is a two-step process.

## npm-list(1)

This command will print to stdout all the versions of packages that are
installed, as well as their dependencies, in a tree-structure.

## npm-npm(1)

npm is the package manager for the Node JavaScript platform.  It puts
modules in place so that node can find them, and manages dependency
conflicts intelligently.

## npm-outdated(1)

This command will check the registry to see if any (or, specific) installed
packages are currently outdated.

## npm-owner(1)

Manage ownership of published packages.

## npm-pack(1)

For anything that's installable (that is, a package folder, tarball,
tarball url, name@tag, name@version, or name), this command will fetch
it to the cache, and then copy the tarball to the current working
directory as `<name>-<version>.tgz`, and then write the filenames out to
stdout.

## npm-prefix(1)

Print the prefix to standard out.

## npm-prune(1)

This command removes "extraneous" packages.  If a package name is
provided, then only packages matching one of the supplied names are
removed.

## npm-publish(1)

Publishes a package to the registry so that it can be installed by name.

## npm-rebuild(1)

This command runs the `npm build` command on the matched folders.  This is useful
when you install a new version of node, and must recompile all your C++ addons with
the new binary.

## npm-registry(1)

To resolve packages by name and version, npm talks to a registry website
that implements the CommonJS Package Registry specification for reading
package info.

## npm-removing-npm(1)

So sad to see you go.

## npm-restart(1)

This runs a package's "restart" script, if one was provided.
Otherwise it runs package's "stop" script, if one was provided, and then
the "start" script.

## npm-root(1)

Print the effective `node_modules` folder to standard out.

## npm-run-script(1)

This runs an arbitrary command from a package's "scripts" object.

## npm-scripts(1)

npm supports the "scripts" member of the package.json script, for the
following scripts:

## npm-search(1)

Search the registry for packages matching the search terms.

## npm-semver(1)

As a node module:

## npm-start(1)

This runs a package's "start" script, if one was provided.

## npm-stop(1)

This runs a package's "stop" script, if one was provided.

## npm-submodule(1)

If the specified package has a git repository url in its package.json
description, then this command will add it as a git submodule at
`node_modules/<pkg name>`.

## npm-tag(1)

Tags the specified version of the package with the specified tag, or the
`--tag` config if not specified.

## npm-test(1)

This runs a package's "test" script, if one was provided.

## npm-uninstall(1)

This uninstalls a package, completely removing everything npm installed
on its behalf.

## npm-unpublish(1)

This removes a package version from the registry, deleting its
entry and removing the tarball.

## npm-update(1)

This command will update all the packages listed to the latest version
(specified by the `tag` config).

## npm-version(1)

Run this in a package directory to bump the version and write the new
data back to the package.json file.

## npm-view(1)

This command shows data about a package and prints it to the stream
referenced by the `outfd` config, which defaults to stdout.

## npm-whoami(1)

Print the `username` config to standard output.

