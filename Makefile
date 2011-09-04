SHELL = bash

docs = $(shell find doc -name '*.md' \
				|sed 's|.md|.1|g' \
				|sed 's|doc/|man1/|g' )

htmldocs = $(shell find doc -name '*.md' \
						|sed 's|.md|.html|g' \
						|sed 's|doc/|html/doc/|g' )

doc_subfolders = $(shell find doc -type d \
									|sed 's|doc/|man1/|g' )

# This is the default make target.
# Since 'make' typically does non-installation build stuff,
# it seems appropriate.
submodules:
	! [ -d .git ] || git submodule update --init --recursive

latest: submodules
	@echo "Installing latest published npm"
	@echo "Use 'make install' or 'make link' to install the code"
	@echo "in this folder that you're looking at right now."
	node cli.js install -g -f npm

install: submodules
	node cli.js install -g -f

# backwards compat
dev: install

link: uninstall
	node cli.js link -f

clean: uninstall
	node cli.js cache clean

uninstall: submodules
	node cli.js rm npm -g -f

doc: $(docs) $(htmldocs)

# use `npm install ronn` for this to work.
man1/%.1: doc/%.md
	@[ -x ./node_modules/.bin/ronn ] || node cli.js install ronn
	@[ -d man1 ] || mkdir -p man1
	./node_modules/.bin/ronn --roff $< \
	| perl -pi -e 's/npm\\-([^\(]*)\([0-9]\)/npm help \1/g' \
	> $@

man1/%/: doc/%/
	@[ -d $@ ] || mkdir -p $@

# use `npm install ronn` for this to work.
html/doc/%.html: doc/%.md html/dochead.html html/docfoot.html
	@[ -x ./node_modules/.bin/ronn ] || node cli.js install ronn
	@[ -d html/doc ] || mkdir -p html/doc
	(cat html/dochead.html && \
	 ./node_modules/.bin/ronn -f $< && \
	 cat html/docfoot.html )\
	| sed 's|@NAME@|$*|g' \
	| sed 's|@DATE@|$(shell date -u +'%Y-%M-%d %H:%m:%S')|g' \
	| perl -pi -e 's/<h1>npm(-?[^\(]*\([0-9]\)) -- (.*?)<\/h1>/<h1>npm\1<\/h1> <p>\2<\/p>/g' \
	| perl -pi -e 's/npm-?([^\)]+)\(1\)/<a href="\1.html">npm \1<\/a>/g' \
	| perl -pi -e 's/npm\(1\)/<a href="npm.html">npm<\/a>/g' \
	| perl -pi -e 's/npm\(1\)/<a href="npm.html">npm<\/a>/g' \
	> $@

html/doc/%/: doc/%/ html/doc
	@[ -d $@ ] || mkdir -p $@

test: submodules
	node cli.js test

version: link
	git add package.json &&\
	git ci -m v$(shell npm -v)

publish: link
	git tag -s -m v$(shell npm -v) v$(shell npm -v) &&\
	git push origin master &&\
	npm publish

.PHONY: latest install dev link doc clean uninstall test man
