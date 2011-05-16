#!/bin/sh

if [ "x$0" = "xsh" ]; then
  # run as curl | sh
  # on some systems, you can just do cat>npm-install.sh
  # which is a bit cuter.  But on others, &1 is already closed,
  # so catting to another script file won't do anything.
  curl -s http://npmjs.org/install.sh > npm-install-$$.sh
  sh npm-install-$$.sh
  ret=$?
  rm npm-install-$$.sh
  exit $ret
fi

if ! [ "x$NPM_DEBUG" = "x" ]; then
  set +x
fi

# make sure that node exists
node=`which node 2>&1`
ret=$?
if [ $ret -ne 0 ] || ! [ -x $node ]; then
  echo "npm cannot be installed without nodejs." >&2
  echo "Install node first, and then try again." >&2
  echo "" >&2
  echo "Maybe node is installed, but not in the PATH?" >&2
  echo "Note that running as sudo can change envs." >&2
  echo ""
  echo "PATH=$PATH" >&2
  exit $ret
fi

# set the temp dir
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

url=`curl -s -L http://registry.npmjs.org/npm/$t \
      | $egrep -o 'tarball":"[^"]+' \
      | head -n 1 \
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
        if [ -e node_modules ]; then
          $node node_modules/semver/bin/semver -v "$node_version" -r "$req"
          ret=$?
        else
          $node bin/semver.js -v "$node_version" -r "$req"
          ret=$?
        fi
      fi
      if [ $ret -ne 0 ]; then
        echo "You need node $req to run this program." >&2
        echo "node --version reports: $node_version" >&2
        echo "Please upgrade node before continuing."
        exit $ret
      fi) \
  && (ver=`$node bin/read-package-json.js package.json version`
      isnpm10=0
      if [ $ret -eq 0 ]; then
        req=`$node bin/read-package-json.js package.json engines.node`
        if [ -e node_modules ]; then
          if $node node_modules/semver/bin/semver -v "$ver" -r "1"
          then
            isnpm10=1
          fi
        else
          if $node bin/semver -v "$ver" -r ">=1.0"; then
            isnpm10=1
          fi
        fi
      fi

      ret=0
      if [ $isnpm10 -eq 1 ] && [ -f "scripts/clean-old.sh" ]; then
        if ! [ "x$skipclean" = "x" ] \
            || [ "x$clean" = "xno" ] \
            || [ "x$clean" = "xn" ]; then
          echo "Skipping 0.x cruft clean" >&2
          ret=0
        elif [ "x$clean" = "xy" ] || [ "x$clean" = "xyes" ]; then
          NODE=$node /bin/sh "scripts/clean-old.sh" "-y"
          ret=$?
        else
          NODE=$node /bin/sh "scripts/clean-old.sh" </dev/tty
          ret=$?
        fi
      fi
      if [ $ret -ne 0 ]; then
        echo "Aborted 0.x cleanup.  Exiting." >&2
        exit $ret
      fi) \
  && (if [ "$make" = "NOMAKE" ] || ! $make clean install; then
        $node cli.js cache clean
        $node cli.js rm npm --force --global
        $node cli.js install . --force --global
      fi) \
  && cd "$BACK" \
  && rm -rf "$TMP" \
  && echo "It worked"

ret=$?
if [ $ret -ne 0 ]; then
  echo "It failed" >&2
fi
exit $ret
