SHELL = bash

markdowns = $(shell find doc -name '*.md' | grep -v 'index') README.md

cli_mandocs = $(shell find doc/cli -name '*.md' \
               |sed 's|.md|.1|g' \
               |sed 's|doc/cli/|man/man1/|g' ) \
               man/man1/README.1 \
               man/man1/index.1

api_mandocs = $(shell find doc/api -name '*.md' \
               |sed 's|.md|.3|g' \
               |sed 's|doc/api/|man/man3/|g' )

cli_htmldocs = $(shell find doc/cli -name '*.md' \
                |grep -v 'index.md' \
                |sed 's|.md|.html|g' \
                |sed 's|doc/cli/|html/doc/|g' ) \
                html/doc/README.html \
                html/doc/index.html

api_htmldocs = $(shell find doc/api -name '*.md' \
                |sed 's|.md|.html|g' \
                |sed 's|doc/api/|html/api/|g' )

mandocs = $(api_mandocs) $(cli_mandocs)

htmldocs = $(api_htmldocs) $(cli_htmldocs)

all: submodules doc

submodules:
	! [ -d .git ] || git submodule update --init --recursive

latest: submodules
	@echo "Installing latest published npm"
	@echo "Use 'make install' or 'make link' to install the code"
	@echo "in this folder that you're looking at right now."
	node cli.js install -g -f npm

install: all
	node cli.js install -g -f

# backwards compat
dev: install

link: uninstall
	node cli.js link -f

clean: doc-clean uninstall
	rm npmrc
	node cli.js cache clean

uninstall: submodules
	node cli.js rm npm -g -f

doc: $(mandocs) $(htmldocs)

docclean: doc-clean
doc-clean:
	rm -rf \
    node_modules/ronn \
    node_modules/.bin/ronn \
		.building_ronn \
    doc/cli/index.md \
    doc/api/index.md \
    $(api_mandocs) \
    $(cli_mandocs) \
    $(api_htmldocs) \
    $(cli_htmldocs) \
		&>/dev/null || true

# use `npm install ronn` for this to work.
man/man1/README.1: README.md scripts/doc-build.sh package.json
	scripts/doc-build.sh $< $@

man/man1/%.1: doc/cli/%.md scripts/doc-build.sh package.json
	@[ -d man/man1 ] || mkdir -p man/man1
	scripts/doc-build.sh $< $@

man/man3/%.3: doc/api/%.md scripts/doc-build.sh package.json
	@[ -d man/man3 ] || mkdir -p man/man3
	scripts/doc-build.sh $< $@

html/doc/README.html: README.md html/dochead.html html/docfoot.html scripts/doc-build.sh package.json
	scripts/doc-build.sh $< $@

html/doc/%.html: doc/cli/%.md html/dochead.html html/docfoot.html scripts/doc-build.sh package.json
	scripts/doc-build.sh $< $@

html/api/%.html: doc/api/%.md html/dochead.html html/docfoot.html scripts/doc-build.sh package.json
	scripts/doc-build.sh $< $@

doc/cli/index.md: $(markdowns) scripts/index-build.js scripts/doc-build.sh package.json
	node scripts/index-build.js > $@

node_modules/ronn:
	node cli.js install https://github.com/isaacs/ronnjs/tarball/master

doc: man

man: $(cli_docs) $(api_docs)

test: submodules
	node cli.js test

version: link
	git add package.json &&\
	git ci -m v$(shell npm -v)

publish: link
	git tag -s -m v$(shell npm -v) v$(shell npm -v) &&\
	git push origin --tags &&\
	npm publish &&\
	make doc-publish

docpublish: doc-publish
doc-publish: doc
	rsync -vazu --stats --no-implied-dirs --delete html/doc/ npmjs.org:/var/www/npmjs.org/public/doc
	rsync -vazu --stats --no-implied-dirs --delete html/api/ npmjs.org:/var/www/npmjs.org/public/api

sandwich:
	@[ $$(whoami) = "root" ] && (echo "ok"; echo "ham" > sandwich) || echo "make it yourself"

.PHONY: all latest install dev link doc clean uninstall test man doc-publish doc-clean docclean docpublish
