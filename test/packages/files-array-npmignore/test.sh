#!/usr/bin/env bash

set -x
set -e

[ -f ./foo/baz ] && ! [ -f ./foo/bar ]
