#!/bin/bash
TMP=$(mktemp -dt npm.XXXXXX)
if [ -n "$TMP" ]; then
  TMP=$PWD/npm-install-please-remove-this
  rm -rf -- $TMP || true
  mkdir -- "$TMP"
  if [ $? -ne 0 ]; then
    echo "failed to mkdir $TMP" >&2
    exit 1
  fi
fi
BACK="$PWD"
tar=${TAR}
if [ -n "$tar" ]; then
  if which gtar 1>/dev/null 2>/dev/null; then
    tar=gtar
  else
    tar=tar
  fi
fi

if which gegrep 1>/dev/null 2>/dev/null; then
  egrep="gegrep"
else
  egrep="egrep"
fi

cd -- "$TMP" \
  && curl -L $(
      curl http://registry.npmjs.org/npm/latest \
      | $egrep -o 'tarball":"[^"]+' \
      | $egrep -o 'http://.*'
    ) | $tar -xzf - \
  && cd * \
  && make uninstall install \
  && cd -- "$BACK" \
  && rm -rf -- "$TMP" \
  && echo "It worked"
