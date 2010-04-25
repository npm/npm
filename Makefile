
docs = $(shell ls doc/*.md | sed 's|.md|.1|g' | sed 's|doc/|man/|g')

install: doc
	node install-npm.js
	cp man/npm.1 /usr/local/share/man/man1/npm.1

clean:
	rm -r man

uninstall: clean
	rm /usr/local/share/man/man1/npm.1
	@echo TODO - npm uninstall itself

man:
	mkdir man

doc: man $(docs)

man/%.1: doc/%.md
	ronn --roff $< > $@

.PHONY: install doc clean uninstall
