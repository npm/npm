npm-archive(1) -- Project-local dependency tarball archive
===================================

## SYNOPSIS

    npm archive

## EXAMPLE

Make sure you have a package-lock and an up-to-date install:

```
$ cd ./my/npm/project
$ npm install
added 154 packages in 10s
$ ls | grep package-lock
```

Run `npm archive` in that project

```
$ npm archive
added 1964 packages in 4.103s
```

Commit the newly-created `archived-packages/` directory and the modified `package-lock.json`

```
$ git add package-lock.json archived-packages/
$ git commit -m 'misc: committing dependency archive'
```

Add a dependency as usual -- its archive will be automatically managed.

```
$ npm i aubergine
added 1 package from 1 contributor in 5s
$ git status
 M package-lock.json
 M package.json
?? archived-packages/aubergine-1.0.1-46c5742af.tar
$ git add archived-packages package-lock.json package.json
$ git commit -m 'deps: aubergine@1.0.1'
```

The inverse happens when a package is removed.

You can then install normally using `npm-ci(1)` or `npm-install(1)`!

```
$ npm ci
added 1965 packages in 10.5s
```

Finally, you can remove and disable the archive, restoring `package-lock.json` its normal state, by using `npm-unarchive(1)`.

```
$ npm unarchive

```
## DESCRIPTION

This command generates a committable archive of your project's dependencies. There are several benefits to this:

1. Offline installs without having to warm up npm's global cache
2. No need for configuring credentials for dependency fetching
3. Much faster installs vs standard CI configurations
4. No need to have a `git` binary present in the system
5. Reduced download duplication across teams

`npm-archive` works by generating tarballs for your dependencies, unzipping them, and storing them in a directory called `archived-packages/`. It then rewrites your `package-lock.json` (or `npm-shrinkwrap.json`) such that the `resolved` field on those dependencies refers to the path in `archived-packages/`.

npm will detect these `file:` URLs and extract package data directly from them instead of the registry, git repositories, etc.

When installing or removing dependencies, npm will look for `archived-packages/` and switch to an "archive mode", which will automatically update archive files and information on every relevant npm operation. Remember to commit the directory, not just `package-lock.json`!

As an added benefit, `npm-archive` will generate tarballs for all your git dependencies and pre-pack them, meaning npm will not need to invoke the git binary or go through other heavy processes git dependencies go to -- making git deps as fast as registry dependencies when reinstalling from an archive.

If specific tarballs are removed from the archive, npm will fall back to standard behavior for fetching dependencies: first checking its global cache, then going out and fetching the dependency from its origin. To regenerate the tarball for a package after removing it, just reinstall the package while in archive mode.

## SEE ALSO

* npm-unarchive(1)
* npm-package-locks(5)
* npm-ci(1)
