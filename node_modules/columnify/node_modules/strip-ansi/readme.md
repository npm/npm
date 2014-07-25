# strip-ansi [![Build Status](https://travis-ci.org/sindresorhus/strip-ansi.svg?branch=master)](https://travis-ci.org/sindresorhus/strip-ansi)

> Strip [ANSI escape codes](http://en.wikipedia.org/wiki/ANSI_escape_code#Colors_and_Styles) (used for colorizing strings in the terminal)

Used in the terminal color module [chalk](https://github.com/sindresorhus/chalk).


## Install

```bash
$ npm install --save strip-ansi
```


## Usage

```js
var stripAnsi = require('strip-ansi');

stripAnsi('\x1b[4mcake\x1b[0m');
//=> 'cake'
```


## CLI

You can also use it as a CLI app by installing it globally:

```bash
$ npm install --global strip-ansi
```

#### Usage

```bash
$ strip-ansi --help

strip-ansi <input-file>
or
cat <input-file> | strip-ansi
```


## License

[MIT](http://opensource.org/licenses/MIT) © [Sindre Sorhus](http://sindresorhus.com)
