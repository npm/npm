# add-to-path

Status:
[![npm version](https://img.shields.io/npm/v/add-to-path.svg?style=flat-square)](https://www.npmjs.org/package/add-to-path)
[![npm downloads](https://img.shields.io/npm/dm/add-to-path.svg?style=flat-square)](http://npm-stat.com/charts.html?package=add-to-path&from=2015-09-01)
[![Build Status](https://img.shields.io/travis/kentcdodds/node-add-to-path.svg?style=flat-square)](https://travis-ci.org/kentcdodds/node-add-to-path)
[![Code Coverage](https://img.shields.io/codecov/c/github/kentcdodds/node-add-to-path.svg?style=flat-square)](https://codecov.io/github/kentcdodds/node-add-to-path)

This micro-lib allows you to alter the `$PATH` in a cross-platform way.

## Main Usage

```javascript
var path = require('path');
var addToPath = require('add-to-path');
var restorePath = addToPath(path.join(process.cwd(), 'node_modules', '.bin'));
// process.env.PATH now starts with the `.bin` in your `node_modules` directory :-)
// unless you happen to be running on windows, in which case it *might* be process.env.Path :-)
// but you don't have to think about that...
// want to restore the path to what it was before you mucked with it?
// just call the function you get back:
restorePath();

// wanna add several paths at once? Done!
addToPath(['/foo/bar/.bin', '/bar/foo/.bin']);
```


## options

### platform

Allows you to specify your own platform. Defaults to `process.platform`. Currently the only meaningful value is
`'win32'`. This option is mainly available for testing purposes.

### append

Defaults to `undefined`, but when set to `true` will add the directory you pass to the end (rather than the beginning).

# Other info

LICENSE -> MIT

Much of the original code for this came from [npm/npm](https://github.com/npm/npm)

