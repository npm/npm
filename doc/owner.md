npm-owner(1) -- Manage package owners
=====================================

## SYNOPSIS

    npm owner ls <package name>
    npm owner add <user> <package name>
    npm owner rm <user> <package name>

## DESCRIPTION

* ls:
  List all the users who have access to modify a package and push new versions.
  Handy when you need to know who to bug for help.
* add:
  Add a new user as a maintainer of a package.  This user is enabled to modify
  metadata, publish new versions, and add other owners.
* rm:
  Remove a user from the package owner list.  This immediately revokes their
  privileges.

Note that there is only one level of access.  Either you can modify a package,
or you can't.  Future versions may contain more fine-grained access levels, but
that is not implemented at this time.

## CONFIGURATION

### outfd

Default: Standard Output FD (1)

The file descriptor (integer) or stream object where npm will write
"normal" output.  For instance, the `ls` and `view` commands write their
output here.

When using npm programmatically, you may want to provide a
FileWriteStream, or some other form of WritableStream.

### registry

Default: https://registry.npmjs.org/

The base URL of the npm package registry.

### _auth

A base-64 encoded "user:pass" pair.  This is created by npm-adduser(1).

If your config file is ever corrupted, you can set this manually by doing:

    npm adduser

### username, _password

Once the configuration is parsed, the `_auth` config is split into
`username` and `_password`.  This is the part before the ":"

## SEE ALSO

* npm-publish(1)
* npm-registry(1)
