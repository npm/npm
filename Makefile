
docs = $(shell ls doc/*.md \
        |sed 's|.md|.1|g' \
        |sed 's|doc/|man/|g' \
        )

install: doc_install
	node install-npm.js

doc_install: doc
	cd man && \
	for d in $(shell ls *.1); do \
	  cp man/$$d /usr/local/share/man/man1/npm-$$d; \
	done;

clean:
	rm -r man

uninstall: clean
	rm /usr/local/share/man/man1/npm{-*,}.1
	@echo TODO - npm uninstall itself

man:
	mkdir man

doc: man $(docs)

man/%.1: doc/%.md
	ronn --roff $< > $@

.PHONY: install doc clean uninstall doc_install
