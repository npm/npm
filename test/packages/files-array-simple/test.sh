#!/usr/bin/env bash

set -x
set -e

# test that there is a foo file, and that there is NOT a bar file
[ -f ./foo ] && ! [ -f ./bar ]
