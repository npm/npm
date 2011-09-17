SHELL = bash

markdowns = $(shell find doc -name '*.md' | grep -v 'index') README.md

docs = $(shell find doc -name '*.md' \
        |grep -v 'index.md' \
        |sed 's|.md|.1|g' \
        |sed 's|doc/|man1/|g' ) \
        man1/README.1 \
        man1/index.1

htmldocs = $(shell find doc -name '*.md' \
            |grep -v 'index.md' \
            |sed 's|.md|.html|g' \
            |sed 's|doc/|html/doc/|g' ) \
            html/doc/README.html \
            html/doc/index.html

doc_subfolders = $(shell find doc -type d \
                  |sed 's|doc/|man1/|g' )

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

doc: $(docs) $(htmldocs)

doc-clean:
	rm doc/index.md $(docs) $(htmldocs) &>/dev/null || true

# use `npm install ronn` for this to work.
man1/README.1: README.md scripts/doc-build.sh package.json
	scripts/doc-build.sh $< $@

man1/%.1: doc/%.md scripts/doc-build.sh package.json
	scripts/doc-build.sh $< $@

html/doc/README.html: README.md html/dochead.html html/docfoot.html scripts/doc-build.sh package.json
	scripts/doc-build.sh $< $@

html/doc/%.html: doc/%.md html/dochead.html html/docfoot.html scripts/doc-build.sh package.json
	scripts/doc-build.sh $< $@

doc/index.md: $(markdowns) scripts/index-build.js scripts/doc-build.sh package.json
	node scripts/index-build.js > doc/index.md

test: submodules
	node cli.js test

version: link
	git add package.json &&\
	git ci -m v$(shell npm -v)

publish: link
	git tag -s -m v$(shell npm -v) v$(shell npm -v) &&\
	git push origin master --tags &&\
	npm publish &&\
	make doc-publish

doc-publish: doc
	rsync -vazu --stats --no-implied-dirs --delete html/doc/ npmjs.org:/var/www/npmjs.org/public/doc

.PHONY: latest install dev link doc clean uninstall test man doc-publish doc-clean
