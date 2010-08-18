
docs = $(shell find doc -name '*.md' \
				|sed 's|.md|.1|g' \
				|sed 's|doc/|man/|g' \
				)
doc_subfolders = $(shell find doc -type d \
									|sed 's|doc/|man/|g' \
									)

install:
	node cli.js install npm

dev:
	node cli.js install .

link:
	node cli.js link .

uninstall:
	node cli.js cache clean
	node cli.js rm npm

man: $(doc_subfolders)
	@if ! test -d man ; then mkdir -p man ; fi

doc: man $(docs)
	@true

# use `npm install ronn` for this to work.
man/%.1: doc/%.md
	ronn --roff $< > $@

man/%/: doc/%/
	@if ! test -d $@ ; then mkdir -p $@ ; fi

test:
	./test/run.sh

.PHONY: install install-dev link doc clean uninstall test
