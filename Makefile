
docs = $(shell ls doc/*.md \
        |sed 's|.md|.1|g' \
        |sed 's|doc/|man/|g' \
        )

install:
	@node install-npm.js

man:
	@mkdir man

doc: man $(docs)
	@true

man/%.1: doc/%.md
	ronn --roff $< > $@

.PHONY: install doc clean uninstall
