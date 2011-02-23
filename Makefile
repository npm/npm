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
	! [ -d .git ] || git submodule update --init

latest: submodules
	@echo "Installing latest published npm"
	@echo "Use 'make install' or 'make link' to install the code"
	@echo "in this folder that you're looking at right now."
	node cli.js install

install: submodules
	node cli.js install

# backwards compat
dev: install

link: uninstall
	node cli.js link

clean: uninstall

uninstall: submodules
	node cli.js cache clean
	node cli.js rm npm -f

man: man1

man1: $(doc_subfolders)
	@if ! test -d man1 ; then mkdir -p man1 ; fi

doc: man1 $(docs)

# use `npm install ronn` for this to work.
man1/%.1: doc/%.md
	ronn --roff $< > $@

man1/%/: doc/%/
	@if ! test -d $@ ; then mkdir -p $@ ; fi

test: submodules
	./test/run.sh

version: link
	git add package.json \
		&& git ci -m v$(shell npm -v)

publish: link
	git tag -s -m v$(shell npm -v) v$(shell npm -v) \
		&& git push origin master \
		&& npm publish

.PHONY: latest install dev link doc clean uninstall test man
