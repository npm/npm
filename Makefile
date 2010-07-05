
docs = $(shell find doc -name '*.md' \
				|sed 's|.md|.1|g' \
				|sed 's|doc/|man/|g' \
				)
doc_subfolders = $(shell find doc -type d \
									|sed 's|doc/|man/|g' \
									)

install-stable:
	./cli.js --auto-activate always install npm@stable

install:
	./cli.js --auto-activate always install .

link:
	./cli.js --auto-activate always link .

uninstall:
	./cli.js cache clean
	./cli.js rm npm

man: $(doc_subfolders)
	@if ! test -d man ; then mkdir -p man ; fi

doc: man $(docs)
	@true

man/%.1: doc/%.md
	ronn --roff --pipe $< > $@

man/%/: doc/%/
	@if ! test -d $@ ; then mkdir -p $@ ; fi

test:
	./test/run.sh

.PHONY: install install-stable link doc clean uninstall test
