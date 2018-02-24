npm-unarchive(1) -- Restore project to a non-archived state.
===================================

## SYNOPSIS

    npm unarchive

## EXAMPLE

```
$ npm unarchive
archive information and tarballs removed
```
## DESCRIPTION

This command undoes the work of `npm-archive(1)` by doing the following:

1. Removes the `archived-packages/` directory.
2. Restores the entires in `package-lock.json` to use non-`file:` resolved URLs and updates their `integrity` fields.
3. Removes `node_modules/` to prevent archive-related changes from affecting future installs.

## SEE ALSO

* npm-archive(1)
* npm-package-locks(5)
