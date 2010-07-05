#!/bin/sh

mkdir npm \
  && cd npm \
  && curl -L http://github.com/isaacs/npm/tarball/master | tar xz --strip 1 \
  && make \
  && cd .. \
  && rm -rf npm \
  && echo "It worked"
