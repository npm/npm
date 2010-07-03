#!/bin/bash

# the "npm" command is set to a custom function here so that we can
# test the code in this repo, rather than whichever version of npm
# happens to be installed.

main () {
  # setup
  FAILURES=0
  npm install "$NPMPKG"

  # TODO: add more tests here.
  # Run node programs by doing node some-thing.js
  
  node test-npm-installed.js
  
  # teardown
  npm rm npm
  # FIXME: removing npm should take this with it.
  rm -rf "$TESTDIR/root/.npm"
  
  [ $FAILURES -gt 0 ] && echo_err "FAILED: $FAILURES" || echo_err "ok"
  exit $FAILURES
}



####################
# Test Harness below

# fake functions
npm () {
  "$NPMCLI" --binroot "$TESTDIR/bin" --root "$TESTDIR/root" "$@" \
    &>output.log \
    || fail npm "$@"
  rm output.log
}
node () {
  local prog="$TESTDIR/$1"
  PATH="$PATH":"$TESTDIR/bin" NODE_PATH="$TESTDIR/root" $(which node) "$prog" \
    &>output.log \
    || fail node "$@"
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

echo_err () {
  echo "$@" >&2
}
fail () {
  let 'FAILURES += 1'
  cat output.log
  echo_err ""
  echo_err -e "\033[33mFailure: $@\033[m"
}

main
