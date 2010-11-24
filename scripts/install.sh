#!/bin/sh
r=${RANDOM-$(date +%s)}
TMP=$(mktemp -dt npm.XXXXXX)
if [ "x$TMP" == "x" ]; then
  TMP=$PWD/npm-$r
  mkdir -- "$TMP" || (echo "failed to mkdir $TMP" >&2 ; exit 1)
fi
BACK="$PWD"
tar=${TAR-$(if which gtar 1>/dev/null 2>/dev/null; then echo "gtar" ; else echo "tar" ; fi)}
egrep=$(if which gegrep 1>/dev/null 2>/dev/null; then echo "gegrep" ; else echo "egrep" ; fi)
cd -- "$TMP" \
  && curl -L $(
      curl http://registry.npmjs.org/npm/latest \
      | $egrep -o 'tarball":"[^"]+' \
      | $egrep -o 'http://.*'
    ) | $tar -xzf - --strip-components=1 \
  && make uninstall install \
  && cd -- "$BACK" \
  && rm -rf -- "$TMP" \
  && echo "It worked"
