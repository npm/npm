
docs = $(shell find doc -name '*.md' \
				|sed 's|.md|.1|g' \
				|sed 's|doc/|man1/|g' \
				)
doc_subfolders = $(shell find doc -type d \
									|sed 's|doc/|man1/|g' \
									)

install:
	node cli.js install npm

dev:
	node cli.js install

link:
	node cli.js link

clean: uninstall
	true

uninstall:
	node cli.js cache clean
	node cli.js rm npm

man: man1
	@true

man1: $(doc_subfolders)
	@if ! test -d man1 ; then mkdir -p man1 ; fi

doc: man1 $(docs)
	@true

# use `npm install ronn` for this to work.
man1/%.1: doc/%.md
	ronn --roff $< > $@

man1/%/: doc/%/
	@if ! test -d $@ ; then mkdir -p $@ ; fi

test:
	./test/run.sh

.PHONY: install install-dev link doc clean uninstall test man
