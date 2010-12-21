#!/bin/sh

TMP="${TMPDIR}"
if [ "x$TMP" = "x" ]; then
  TMP="/tmp"
fi
TMP="${TMP}/npm.$$"
rm -rf "$TMP" || true
mkdir "$TMP"
if [ $? -ne 0 ]; then
  echo "failed to mkdir $TMP" >&2
  exit 1
fi

BACK="$PWD"
tar="${TAR}"
if [ -z "$tar" ]; then
  # sniff for gtar/gegrep
  # use which, but don't trust it very much.
  tar=`which gtar 2>&1`
  if [ $? -ne 0 ] || ! [ -x $tar ]; then
    tar=tar
  fi
fi

egrep=`which gegrep 2>&1`
if [ $? -ne 0 ] || ! [ -x $egrep ]; then
  egrep=egrep
fi

url=`curl http://registry.npmjs.org/npm/latest \
      | $egrep -o 'tarball":"[^"]+' \
      | $egrep -o 'http://.*'`
ret=$?
if [ $ret -ne 0 ]; then
  echo "Failed to get tarball url" >&2
  exit $ret
fi

cd "$TMP" \
  && curl -L "$url" | $tar -xzf - \
  && cd * \
  && make uninstall install \
  && cd "$BACK" \
  && rm -rf "$TMP" \
  && echo "It worked"
ret=$?
if [ $ret -ne 0 ]; then
  echo "It failed" >&2
fi
exit $ret
