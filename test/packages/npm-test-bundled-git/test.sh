#!/usr/bin/bash

d=$(diff node_modules/glob/node_modules/minimatch/package.json minimatch-expected.json)

if [ "$d" != "" ]; then
  echo "didn't get expected minimatch/package.json" >&2
  echo "$d" >&2
  exit 1
fi
