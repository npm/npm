SHELL = bash

cli_docs = $(shell find doc/cli -name '*.md' \
				|sed 's|.md|.1|g' \
				|sed 's|doc/cli/|man/man1/|g' )

api_docs = $(shell find doc/api -name '*.md' \
				|sed 's|.md|.3|g' \
				|sed 's|doc/api/|man/man3/|g' )

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

doc: man

man: $(cli_docs) $(api_docs)

man/man1:
	[ -d man/man1 ] || mkdir -p man/man1

man/man3:
	[ -d man/man3 ] || mkdir -p man/man3

# use `npm install ronn` for this to work.
man/man1/%.1: doc/cli/%.md man/man1
	@[ -x ./node_modules/.bin/ronn ] || node cli.js install ronn
	./node_modules/.bin/ronn --roff $< > $@

man/man3/%.3: doc/api/%.md man/man3
	@[ -x ./node_modules/.bin/ronn ] || node cli.js install ronn
	./node_modules/.bin/ronn --roff $< > $@

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
