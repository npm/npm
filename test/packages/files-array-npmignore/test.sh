#!/usr/bin/env bash

set -x
set -e

if [[ $npm_package_version == "9999.0.0-LINK-"* ]]; then
  echo "link package, skipping test"
  exit 0
fi

[ -f ./foo/baz ] && ! [ -f ./foo/bar ]
