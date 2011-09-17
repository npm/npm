#!/bin/sh

# A word about this shell script:
#
# It must work everywhere, including on systems that lack
# a /bin/bash, map 'sh' to ksh, ksh97, bash, ash, or zsh,
# and potentially have either a posix shell or bourne
# shell living at /bin/sh.
#
# See this helpful document on writing portable shell scripts:
# http://www.gnu.org/s/hello/manual/autoconf/Portable-Shell.html
#
# The only shell it won't ever work on is cmd.exe.

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

npm_config_loglevel="error"
if [ "x$npm_debug" = "x" ]; then
  (exit 0)
else
  echo "Running in debug mode."
  echo "Note that this requires bash or zsh."
  set -o xtrace
  set -o pipefail
  npm_config_loglevel="verbose"
fi
export npm_config_loglevel

# make sure that node exists
node=`which node 2>&1`
ret=$?
if [ $ret -eq 0 ] && [ -x "$node" ]; then
  (exit 0)
else
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

# sniff for gtar/gmake
# use which, but don't trust it very much.

tar="${TAR}"
if [ -z "$tar" ]; then
  tar=tar
fi


# Try to find a suitable make
# If the MAKE environment var is set, use that.
# otherwise, try to find gmake, and then make.
# If no make is found, then just execute the necessary commands.
if [ "x$MAKE" = "x" ]; then
  make=`which gmake 2>&1`
  if [ $? -eq 0 ] && [ -x $make ]; then
    (exit 0)
  else
    make=`which make 2>&1`
    if [ $? -eq 0 ] && [ -x $make ]; then
      (exit 0)
    else
      make=NOMAKE
    fi
  fi
else
  make="$MAKE"
fi

if [ -x "$make" ]; then
  (exit 0)
else
  echo "Installing without make. This may fail." >&2
  make=NOMAKE
fi

# If there's no bash, then don't even try to clean
if [ -x "/bin/bash" ]; then
  (exit 0)
else
  clean="no"
fi

t="${npm_install}"
if [ -z "$t" ]; then
  t="latest"
fi

# need to echo "" after, because Posix sed doesn't treat EOF
# as an implied end of line.
url=`(curl -SsL http://registry.npmjs.org/npm/$t; echo "") \
     | sed -e 's/^.*tarball":"//' -e 's/".*$//'`

ret=$?
if [ $ret -ne 0 ]; then
  echo "Failed to get tarball url" >&2
  exit $ret
fi

echo "fetching: $url" >&2

cd "$TMP" \
  && curl -s -L "$url" | gzip --decompress --stdout | $tar -xf - \
  && cd * \
  && (node_version=`"$node" --version 2>&1`
      ret=$?
      if [ $ret -eq 0 ]; then
        req=`"$node" bin/read-package-json.js package.json engines.node`
        if [ -e node_modules ]; then
          "$node" node_modules/semver/bin/semver -v "$node_version" -r "$req"
          ret=$?
        else
          "$node" bin/semver.js -v "$node_version" -r "$req"
          ret=$?
        fi
      fi
      if [ $ret -ne 0 ]; then
        echo "You need node $req to run this program." >&2
        echo "node --version reports: $node_version" >&2
        echo "Please upgrade node before continuing."
        exit $ret
      fi) \
  && (ver=`"$node" bin/read-package-json.js package.json version`
      isnpm10=0
      if [ $ret -eq 0 ]; then
        req=`"$node" bin/read-package-json.js package.json engines.node`
        if [ -e node_modules ]; then
          if "$node" node_modules/semver/bin/semver -v "$ver" -r "1"
          then
            isnpm10=1
          fi
        else
          if "$node" bin/semver -v "$ver" -r ">=1.0"; then
            isnpm10=1
          fi
        fi
      fi

      ret=0
      if [ $isnpm10 -eq 1 ] && [ -f "scripts/clean-old.sh" ]; then
        if [ "x$skipclean" = "x" ]; then
          (exit 0)
        else
          clean=no
        fi
        if [ "x$clean" = "xno" ] \
            || [ "x$clean" = "xn" ]; then
          echo "Skipping 0.x cruft clean" >&2
          ret=0
        elif [ "x$clean" = "xy" ] || [ "x$clean" = "xyes" ]; then
          NODE="$node" /bin/bash "scripts/clean-old.sh" "-y"
          ret=$?
        else
          NODE="$node" /bin/bash "scripts/clean-old.sh" </dev/tty
          ret=$?
        fi
      fi

      if [ $ret -ne 0 ]; then
        echo "Aborted 0.x cleanup.  Exiting." >&2
        exit $ret
      fi) \
  && (if [ "$make" = "NOMAKE" ]; then
        (exit 0)
      elif "$make" clean install; then
        (exit 0)
      else
        make="NOMAKE"
      fi
      if [ "$make" = "NOMAKE" ]; then
        "$node" cli.js rm npm -gf
        "$node" cli.js install -gf
      fi) \
  && cd "$BACK" \
  && rm -rf "$TMP" \
  && echo "It worked"

ret=$?
if [ $ret -ne 0 ]; then
  echo "It failed" >&2
fi
exit $ret
