npm-adduser(1) -- Add a registry user account
=============================================

## SYNOPSIS

    npm adduser <username> <password> <email>

## DESCRIPTION

Create a user named `<username>` in the npm registry, and save the
credentials to the `.npmrc` file. Note that this leaves the password
in your `.bash_history`, and it is currently stored in the clear in
the config file. So, don't use a password you care too much about.

For now, if you somehow break your `.npmrc` file, and have forgotten your
password, you're boned. Send an email to i@izs.me and I'll delete the
record from the registry so that you can re-add it.

If you break your `.npmrc` file, but you remember your password, you
can put your user auth back by using the `base64` program like so:

    npm config set auth $( echo -n user:pass | base64 )

Install base64 using whichever method you normally use to put programs on
your computer.  (apt-get, homebrew, macports, yum, or just download the
code and build it yourself.)

Or bug me to to remove your account, and then recreate it.
