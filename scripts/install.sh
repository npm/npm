#!/bin/sh
r=${RANDOM-$(date +%s)}
tar=${TAR-$(if (which gtar 2>/dev/null) ; then which gtar ; else echo "tar" ; fi)}
mkdir npm-$r \
  && cd npm-$r \
  && curl -L http://github.com/isaacs/npm/tarball/master | $tar xzf - --strip-components=1 \
  && make uninstall install \
  && cd .. \
  && rm -rf npm-$r \
  && echo "It worked"
