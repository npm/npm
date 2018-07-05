# default-shell [![Build Status](https://travis-ci.org/sindresorhus/default-shell.svg?branch=master)](https://travis-ci.org/sindresorhus/default-shell)

> Get the user's default [shell](https://en.wikipedia.org/wiki/Shell_(computing))


## Install

```
$ npm install --save default-shell
```


## Usage

```js
const defaultShell = require('default-shell');

// OS X
console.log(defaultShell);
//=> '/bin/bash'

// Windows
console.log(defaultShell);
//=> 'C:\\WINDOWS\\system32\\cmd.exe'
```


## License

MIT © [Sindre Sorhus](http://sindresorhus.com)
