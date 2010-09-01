#!/bin/bash

# the "npm" command is set to a custom function here so that we can
# test the code in this repo, rather than whichever version of npm
# happens to be installed.

main () {
  # setup
  FAILURES=0

  # TODO: add more tests here.
  # Run node programs by doing node some-thing.js

  cd "$TESTDIR"

  # install
  npm install "$NPMPKG" || exit 1
  npm install $( ls packages | awk '{print "packages/" $1 }' ) || exit 1
  (ls packages | while read pkg; do
    npm test "$pkg"@"$(ls -- "$ROOTDIR"/.npm/"$pkg" | grep -v active)"
  done) || exit 1
  if [ "$FAILURES" == "0" ]; then
    npm rm $(ls packages) npm || exit 1
  fi
  cleanup

  # link
  npm install "$NPMPKG" || exit 1 
  (ls packages | awk '{print "packages/" $1 }' | while read pkg; do
    npm link "$pkg"
  done) || exit 1
  (ls packages | while read pkg; do
    npm test "$pkg"@"$(ls -- "$ROOTDIR"/.npm/"$pkg" | grep -v active)"
  done) || exit 1
  if [ "$FAILURES" == "0" ]; then
    npm rm $(ls packages) npm || exit 1
  fi
  cleanup

  if [ $FAILURES -eq 0 ]; then
    echo_err "ok"
  else
    echo_err "FAILED: $FAILURES"
  fi
  exit $FAILURES
}



####################
# Test Harness below

# fake functions
npm () {
  echo -e "npm $@"
  "$NPMCLI" "$@" &>output.log \
    || fail npm "$@"
  echo -n "" > output.log
}
node () {
  local prog="$TESTDIR/$1"
  $(which node) "$prog" &>output.log \
    || fail node "$@"
  echo -n "" > output.log
}

# get the absolute path of the executable
SELF_PATH="$0"
if [ "${SELF_PATH:0:1}" != "." ] && [ "${SELF_PATH:0:1}" != "/" ]; then
  SELF_PATH=./"$SELF_PATH"
fi
SELF_PATH=$( cd -P -- "$(dirname -- "$SELF_PATH")" \
          && pwd -P \
          ) && SELF_PATH=$SELF_PATH/$(basename -- "$0")
# resolve symlinks
while [ -h "$SELF_PATH" ]; do
  DIR=$(dirname -- "$SELF_PATH")
  SYM=$(readlink -- "$SELF_PATH")
  SELF_PATH=$( cd -- "$DIR" \
            && cd -- $(dirname -- "$SYM") \
            && pwd \
            )/$(basename -- "$SYM")
done
NPMPKG="$(dirname -- "$(dirname -- "$SELF_PATH")")"
NPMCLI="$NPMPKG/cli.js"
TESTDIR="$NPMPKG/test/"
ROOTDIR="$TESTDIR/root"
BINDIR="$TESTDIR/bin"
MANDIR="$TESTDIR/man"

cleanup () {
  if [ "$FAILURES" != "0" ] && [ "$FAILURES" != "" ]; then
    return
  fi
  [ -d "$ROOTDIR" ] && rm -rf -- "$ROOTDIR"
  [ -d "$BINDIR" ] && rm -rf -- "$BINDIR"
  [ -d "$MANDIR" ] && rm -rf -- "$MANDIR"
  mkdir -p -- "$ROOTDIR"
  mkdir -p -- "$BINDIR"
  mkdir -p -- "$MANDIR"
}

export npm_config_root="$ROOTDIR"
export npm_config_binroot="$BINDIR"
export npm_config_manroot="$MANDIR"
export PATH="$PATH":"$BINDIR"
export NODE_PATH="$ROOTDIR"

echo_err () {
  echo "$@" >&2
}
fail () {
  let 'FAILURES += 1'
  cat output.log
  echo_err ""
  echo_err -e "\033[33mFailure: $@\033[m"
  exit 1
}

cleanup
main
