# i18npm [![Build Status](https://travis-ci.org/watilde/i18npm.svg?branch=master)](https://travis-ci.org/watilde/i18npm)
To keep weekly release, translated locale files should be placed out of npm(and its repository as well), and also they should be easy to be referred by `npm.config`. It means it is a possibility translated files come after the release like the following:

```
inside global module, like npm-lang-ja
└── locales
    └── ja
        └── 1.0.0.json
        └── 1.0.1.json

inside npm
└── locales/
    └── en
        └── 1.0.0.json
        └── 1.0.1.json
        └── 1.0.2.json <= new!
```

## Usage
```js
var path = require('path')
var pkg = require('./package.json')
var i18n = require('i18npm')({
  verison: pkg.version,
  path: path.join(__dirname, 'locales/ja'),
  fallbackPath: path.join(__dirname, 'locales/en')
})
var __ = i18n.__

console.log(__('Hello World!'))
```

## Example
Use case in npm

### lib/utils/i18n.js
```js
var npm = require('../npm.js')
var defaults = require('../config/defaults')

module.exports = require('i18npm')({
  verison: npm.version,
  path: config.get('locale-file-directory'),
  fallbackPath: defaults['locale-file-directory']
})
```

### lib/test.js
```js
module.exports = test

var __ = require('./utils/i18n').__
var testCmd = require('./utils/lifecycle.js').cmd('test')

function test (args, cb) {
  testCmd(args, function (er) {
    if (!er) return cb()
    if (er.code === 'ELIFECYCLE') {
      return cb(__('Test failed.  See above for more details.'))
    }
    return cb(er)
  })
}
```

## API
Inspired by [y18n](https://www.npmjs.com/package/y18n).

### i18npm(config)
config:
+ `version` {String} Handle a exactly file name including version number
+ `path` {String} Base directory
+ `fallbackPath` {String} When there is no source file or no translated text, this base will be used

### i18npm.__(str, args, args...)
Return a localized string, %s will be replaced with args.

## License
MIT
