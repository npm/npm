#!/bin/sh

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
  tar=`which gtar 2>&1`
  if [ $? -ne 0 ] || ! [ -x $tar ]; then
    tar=tar
  else
    # tar is used by npm, so let's set the config all over the place.
    # This isn't guaranteed to work, but it is very likely.
    if [ -d $HOME ]; then
      echo "tar = $tar" >> $HOME/.npmrc
    fi
    globalconfig=`dirname "$node"`
    globalconfig=`dirname "$globalconfig"`
    globalconfig="$globalconfig"/etc/npmrc
    echo "tar = $tar" >> $globalconfig

    echo "It would be wise to add 'TAR=$tar' to your environment." >&2
  fi
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

url=`curl -s http://registry.npmjs.org/npm/latest \
      | $egrep -o 'tarball":"[^"]+' \
      | $egrep -o 'http://.*'`
ret=$?
if [ $ret -ne 0 ]; then
  echo "Failed to get tarball url" >&2
  exit $ret
fi

me=`whoami`
sudo=""
if ! [ "x$me" = "xroot" ]; then
  echo "Not running as root.  Will attempt to use sudo." >&2
  sudo="sudo"
fi

cd "$TMP" \
  && curl -s -L "$url" | $tar -xzf - \
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
        SUDO_PROMPT='[npm install] Password:' $sudo $make uninstall dev || \
          ( echo "sudo failed, attempting with unsafe-perm" >&2
            npm_config_unsafe_perm=true $make install dev)
      else
        SUDO_PROMPT='[npm install] Password:' $sudo $node cli.js install . || \
          ( echo "sudo failed, attempting with unsafe-perm" >&2
            npm_config_unsafe_perm=true $node cli.js install .)
      fi) \
  && cd "$BACK" \
  && rm -rf "$TMP" \
  && echo "It worked"

ret=$?
if [ $ret -ne 0 ]; then
  echo "It failed" >&2
fi
exit $ret
