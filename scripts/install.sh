#!/bin/sh

if ! [ "x$NPM_DEBUG" = "x" ]; then
  set +x
fi


node=`which node 2>&1`
ret=$?
if [ $ret -ne 0 ] || ! [ -x $node ]; then
  echo "npm cannot be installed without nodejs." >&2
  echo "Install node first, and then try again." >&2
  exit $ret
fi

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

# sniff for gtar/gegrep/gmake
# use which, but don't trust it very much.

tar="${TAR}"
if [ -z "$tar" ]; then
  tar=tar
fi

egrep=`which gegrep 2>&1`
if [ $? -ne 0 ] || ! [ -x $egrep ]; then
  egrep=egrep
fi

make=`which gmake 2>&1`
if [ $? -ne 0 ] || ! [ -x $make ]; then
  make=`which make 2>&1`
  if [ $? -ne 0 ] || ! [ -x $make ]; then
    make=NOMAKE
    echo "Installing without make. This may fail." >&2
  fi
fi

t="${npm_install}"
if [ -z "$t" ]; then
  t="latest"
fi

url=`curl -s http://registry.npmjs.org/npm/$t \
      | $egrep -o 'tarball":"[^"]+' \
      | $egrep -o 'http://.*'`
echo "fetching: $url" >&2

ret=$?
if [ $ret -ne 0 ]; then
  echo "Failed to get tarball url" >&2
  exit $ret
fi

cd "$TMP" \
  && curl -s -L "$url" | gzip --decompress --stdout | $tar -xf - \
  && cd * \
  && (node_version=`$node --version 2>&1`
      ret=$?
      if [ $ret -eq 0 ]; then
        req=`$node bin/read-package-json.js package.json engines.node`
        $node node_modules/semver/bin/semver -v "$node_version" -r "$req"
        ret=$?
      fi
      if [ $ret -ne 0 ]; then
        echo "You need node $req to run this program." >&2
        echo "node --version reports: $node_version" >&2
        echo "Please upgrade node before continuing."
        exit $ret
      fi) \
  && (if ! [ "$make" = "NOMAKE" ]; then
        $make clean install
      else
        $node cli.js cache clean
        $node cli.js rm npm -f
        $node cli.js install .
      fi) \
  && cd "$BACK" \
  && rm -rf "$TMP" \
  && echo "It worked"

ret=$?
if [ $ret -ne 0 ]; then
  echo "It failed" >&2
fi
exit $ret
