
docs = $(shell ls doc/*.md \
        |sed 's|.md|.1|g' \
        |sed 's|doc/|man/|g' \
        )

install-stable:
	./cli.js --auto-activate always install npm@stable

install:
	./cli.js --auto-activate always install .

link:
	./cli.js --auto-activate always link .

uninstall:
	@echo TODO: have npm uninstall itself.
	@echo See http://github.com/isaacs/npm/issues/issue/27

man:
	@mkdir man

doc: man $(docs)
	@true

man/%.1: doc/%.md
	ronn --roff $< > $@

.PHONY: install install-stable link doc clean uninstall
