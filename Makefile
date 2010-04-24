
install: doc
	node install-npm.js
	mv npm.1 /usr/local/share/man/man1/npm.1

doc:
	ronn --roff README.md > npm.1

.PHONY: install doc
