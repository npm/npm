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
version=$(npm -v)

mkdir -p $(dirname $dest)

case $dest in
	*.html)
    (cat html/dochead.html && \
     ./node_modules/.bin/ronn -f $src && \
     cat html/docfoot.html )\
    | sed "s|@NAME@|$name|g" \
    | sed "s|@DATE@|$date|g" \
    | sed "s|@VERSION@|$version|g" \
    | perl -pi -e 's/<h1>npm(-?[^\(]*\([0-9]\)) -- (.*?)<\/h1>/<h1>npm\1<\/h1> <p>\2<\/p>/g' \
    | perl -pi -e 's/npm-([^\)]+)\(1\)/<a href="\1.html">npm \1<\/a>/g' \
    | perl -pi -e 's/npm\(1\)/<a href="npm.html">npm<\/a>/g' \
    | perl -pi -e 's/README/<a href="README.html">README<\/a>/g' \
    > $dest
		exit $?
		;;
	*.1)
    ./node_modules/.bin/ronn --roff $src \
    | sed "s|@VERSION@|$version|g" \
    | perl -pi -e 's/npm\\-([^\(]*)\([0-9]\)/npm help \1/g' \
    | perl -pi -e 's/npm\([0-9]\)/npm help npm/g' \
    > $dest
		exit $?
		;;
	*)
		echo "Invalid destination type: $dest" >&2
		exit 1
	  ;;
esac
