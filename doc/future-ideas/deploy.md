npm-deploy(1) -- Deploy a package to a remote host
==================================================

## FUTURE

This functionality does not yet exist.

## SUMMARY

    npm deploy <pkg> [--host <hostname>]

## DESCRIPTION

This is a porcelain command.  It is equivalent to doing:

    npm publish --registry $(npm config get host) <pkg>
    npm remote install <pkg-name>@<pkg-version>

That is, it first publishes the package to the server specified
by the `host` config, and then remotely installs that package
on the host.

## SEE ALSO

* npm-remote(1)
* npm-site(1)
* npm-publish(1)
