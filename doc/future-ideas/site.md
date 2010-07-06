npm-site(1) -- Run the npm web site
===================================

## FUTURE

This functionality does not yet exist.

## SYNOPSIS

    npm site [ start | stop ]

## DESCRIPTION

This starts up npm in "site" mode.  The following configs are relevant,
and can either be specified in the `.npmrc` file, or as command line
options.

* userfile:
  A file containing the encrypted authorization info for all users.  If
  specified, then this is used for `npm adduser` requests
  to this registry.  
* admin:
  A comma-delimited list of admin users.  All of these must already be
  in the local adduser config.  If there is no admin, then the site will
  not allow remote management.  All admin usernames must already be
  in the userfile, and a userfile must be specified.
* listen:
  Ports to listen on for WS requests.  The first number is for http,
  the second for https, and the third for secure TCP.  Set any to "-",
  or omit, to use the default.
  Defaults to "80,443,15443"
* registry:
  If a package is not found, then its contents will be fetched from the
  upstream registry, and cached for future retrieval.

  isaacs: Make sure that this does loop-detection, so that a "ring" of
  registries can work as a distributed network.  Also, once we have
  support for checking multiple registries, you could have a distribution
  ring that secondarily depends on some other upstream resource.

The content for the site is stored in the npm cache directory, which is
inside the folder used for the `root` setting, at `{root}/.npm/.cache`.
It is organized in a simple hierarchical folder structure corresponding
to the web service URLs that npm uses.

## TCP Server

The TCP server starts up to support the `npm remote` command, if there is
a valid admin userlist.

## NOTE

This also is what happens when you do `npm start npm`.

## SEE ALSO

* npm-remote(1)
* npm-config(1)
