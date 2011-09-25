#!/bin/bash

if [[ $DEBUG != "" ]]; then
  set -x
fi
set -o errexit
set -o pipefail

[ -x ./node_modules/.bin/ronn ] || node cli.js install ronn

src=$1
dest=$2
name=$(basename ${src%.*})
date=$(date -u +'%Y-%M-%d %H:%m:%S')
version=$(node cli.js -v)

mkdir -p $(dirname $dest)

case $dest in
  *.[13])
    ./node_modules/.bin/ronn --roff $src \
    | sed "s|@VERSION@|$version|g" \
    | perl -pi -e 's/npm\\-([^\(]*)\(1\)/npm help \1/g' \
    | perl -pi -e 's/npm\\-([^\(]*)\(3\)/npm apihelp \1/g' \
    | perl -pi -e 's/npm\(1\)/npm help npm/g' \
    | perl -pi -e 's/npm\(3\)/npm apihelp npm/g' \
    > $dest
    exit $?
    ;;
  *.html)
    (cat html/dochead.html && \
     ./node_modules/.bin/ronn -f $src && \
     cat html/docfoot.html )\
    | sed "s|@NAME@|$name|g" \
    | sed "s|@DATE@|$date|g" \
    | sed "s|@VERSION@|$version|g" \
    | perl -pi -e 's/<h1>npm(-?[^\(]*\([0-9]\)) -- (.*?)<\/h1>/<h1>npm\1<\/h1> <p>\2<\/p>/g' \
    | perl -pi -e 's/npm-npm/npm/g' \
    | perl -pi -e 's/([^"-])(npm-)?README(\(1\))?/\1<a href="..\/doc\/README.html">README<\/a>/g' \
    | perl -pi -e 's/<title><a href="..\/doc\/README.html">README<\/a><\/title>/<title>README<\/title>/g' \
    | perl -pi -e 's/([^"-])npm-([^\(]+)(\(1\))/\1<a href="..\/doc\/\2.html">\2\3<\/a>/g' \
    | perl -pi -e 's/([^"-])npm-([^\(]+)(\(3\))/\1<a href="..\/api\/\2.html">\2\3<\/a>/g' \
    | perl -pi -e 's/([^"-])npm\(1\)/\1<a href="..\/doc\/npm.html">npm(1)<\/a>/g' \
    | perl -pi -e 's/([^"-])npm\(3\)/\1<a href="..\/api\/npm.html">npm(3)<\/a>/g' \
    | perl -pi -e 's/\([13]\)<\/a><\/h1>/<\/a><\/h1>/g' \
    > $dest
    exit $?
    ;;
  *)
    echo "Invalid destination type: $dest" >&2
    exit 1
    ;;
esac
