#!/usr/bin/env bash

set -x
set -e

if [[ $npm_package_version == "9999.0.0-LINK-"* ]]; then
  echo "link package, skipping test"
  exit 0
fi

# test that there is a foo file, and that there is NOT a bar file
[ -f ./foo ] && ! [ -f ./bar ]
