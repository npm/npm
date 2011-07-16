SHELL = bash

docs = $(shell find doc -name '*.md' \
				|sed 's|.md|.1|g' \
				|sed 's|doc/|man1/|g' )

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

uninstall: submodules
	node cli.js cache clean
	node cli.js rm npm -g -f --loglevel error

man: man1

man1: $(doc_subfolders)
	[ -d man1 ] || mkdir -p man1

doc: man1 $(docs)

# use `npm install ronn` for this to work.
man1/%.1: doc/%.md
	@[ -x ./node_modules/.bin/ronn ] || node cli.js install ronn
	./node_modules/.bin/ronn --roff $< > $@

man1/%/: doc/%/
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
