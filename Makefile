
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

link: uninstall
	node cli.js link

clean: uninstall

uninstall:
	node cli.js cache clean
	node cli.js rm npm -r

man: man1

man1: $(doc_subfolders)
	@if ! test -d man1 ; then mkdir -p man1 ; fi

doc: man1 $(docs)

# use `npm install ronn` for this to work.
man1/%.1: doc/%.md
	ronn --roff $< > $@

man1/%/: doc/%/
	@if ! test -d $@ ; then mkdir -p $@ ; fi

test:
	./test/run.sh

version: link
	git add package.json \
		&& git ci -m v$(shell npm -v)

publish: link
	[ "$(shell cat .git/HEAD)" = "ref: refs/heads/master" ] \
		&& git tag -s -m v$(shell npm -v) v$(shell npm -v) \
		&& git push origin master \
		&& npm publish

.PHONY: install install-dev link doc clean uninstall test man
