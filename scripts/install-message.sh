#!/bin/sh

if [ "x$npm_config_loglevel" = "xsilent" ]; then
  exit
fi

cat <<MESSAGE

Thanks for installing version $npm_package_version of npm.

Last few items from the changelog:

`tail -n 20 doc/changelog.md`

MESSAGE
