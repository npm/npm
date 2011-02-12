npm-adduser(1) -- Add a registry user account
=============================================

## SYNOPSIS

    npm adduser

## DESCRIPTION

Create or verify a user named `<username>` in the npm registry, and
save the credentials to the `.npmrc` file.

The username, password, and email are read in from prompts.  This command
cannot be scripted.  If you think you need to script the creation of new
users, or the authorization of existing ones, without human intervention,
please rethink your use case.  That's a very bad idea.

You may use this command to change your email address, but not username
or password.

You may use this command multiple times with the same user account to
authorize on a new machine.

## CONFIGURATION

### _auth

A base-64 encoded "user:pass" pair.  This is created by npm-adduser(1).

If your config file is ever corrupted, you can set this manually by doing:

    npm adduser

### registry

Default: https://registry.npmjs.org/

The base URL of the npm package registry.

### username, _password

Once the configuration is parsed, the `_auth` config is split into
`username` and `_password`.  This is the part before the ":"
