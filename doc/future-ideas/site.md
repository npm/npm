npm-site(1) -- Run the npm web site
===================================

## FUTURE

This functionality does not yet exist.

## SYNOPSIS

    npm site start

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
* port:
  Ports to listen on for WS requests, in the form "http-port,https-port".
  Defaults to "15080,15443".
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

## POST /-/action

When an admin is specified, starting the npm site also enables the
special `POST /-/action` command for doing remote management.  The body
of the POST request is an object with the following members:

* argv:
  Array of positional command-line arguments.
* config:
  Hash of name-value pairs to override the default configuration.

The npm site starts up with the default configuration set to the resolved
configuration at the time of startup.  For instance, if you do:

    npm site --foo bar

then the "foo" config will be set to "bar" for the purposes of commands
specified via `POST /-/action`.



