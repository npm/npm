npm-version(1) -- Bump a package version
========================================

## SYNOPSIS

    npm version <newversion> [--message/-m commit-message]

## DESCRIPTION

Run this in a package directory to bump the version and write the new
data back to the package.json file.

If run in a git repo, it will also create a version commit and tag, and
fail if the repo is not clean.
If supplied with `--message`/`-m` command line option, npm will use
it as a commit message when creating a version commit.

## SEE ALSO

* npm-init(1)
* npm-json(1)
* npm-semver(1)
