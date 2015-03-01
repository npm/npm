npm-upgrade(1) -- Update npm
============================

## SYNOPSIS

    npm upgrade

## DESCRIPTION

This command updates the currently-running `npm` to the `latest`
version that has been published on the `npm` registry.

This command is similar to `npm install -g npm@latest` when `npm` is
installed as one of the global `npm` modules.

When `npm` is not installed in the location specified by `prefix`,
this command attempts to upgrade the running `npm`; since `npm` may
not have permission to write to its own installation directory, you
may need to use `sudo` or a similar command to run with administrative
permissions.

## WARNINGS

If this command fails, it may leave your `npm` in a broken state.  You
can fix this on a Unix-like system by installing `npm` from scratch:

```
curl -L https://npmjs.org/install.sh | sudo sh
```

On Windows, it may be necessary to reinstall `node`.

## SEE ALSO

* npm-install(1)
* npm-update(1)
* npm-install(3)
