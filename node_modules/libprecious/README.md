[![npm](https://img.shields.io/npm/v/libprecious.svg)](https://npm.im/libprecious) [![license](https://img.shields.io/npm/l/libprecious.svg)](https://npm.im/libprecious) [![Travis](https://img.shields.io/travis/zkat/libprecious.svg)](https://travis-ci.org/zkat/libprecious) [![AppVeyor](https://ci.appveyor.com/api/projects/status/github/zkat/libprecious?svg=true)](https://ci.appveyor.com/project/zkat/libprecious) [![Coverage Status](https://coveralls.io/repos/github/zkat/libprecious/badge.svg?branch=latest)](https://coveralls.io/github/zkat/libprecious?branch=latest)

[`libprecious`](https://npm.im/libprecious) installs npm projects in a way
that's optimized for continuous integration/deployment/etc scenarios. It gives
up the ability to build its own trees or install packages individually, as well
as other user-oriented features, in exchange for speed, and being more strict
about project state.

For documentation about the associated command-line tool, see
[`my-precious`](https://npm.im/my-precious).

## Install

`$ npm install libprecious`

## Table of Contents

* [Features](#features)
* [Contributing](#contributing)
* [API](#api)

### Features

* saves all your dependency tarballs to local files
* npm-compatible caching
* errors if `package.json` and `package-lock.json` are out of sync, instead of fixing it like npm does. Essentially provides a `--frozen` install.

### Contributing

The libprecious team enthusiastically welcomes contributions and project
participation! There's a bunch of things you can do if you want to contribute!
The [Contributor Guide](CONTRIBUTING.md) has all the information you need for
everything from reporting bugs to contributing entire new features. Please don't
hesitate to jump in if you'd like to, or even ask us questions if something
isn't clear.

## ACKNOWLEDGEMENTS

`libprecious` is a reimplementation of the concept of
[`shrinkpack`](https://npm.im/shrinkpack), with the intention of integrating it
directly into npm itself, and using common libraries for increased
compatibility.

The `libprecious` team is grateful to Jamie Mason and the rest of the
`shrinkpack` developers for their support and encouragement!
