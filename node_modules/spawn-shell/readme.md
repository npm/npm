# spawn-shell

[![Greenkeeper badge](https://badges.greenkeeper.io/parro-it/spawn-shell.svg)](https://greenkeeper.io/)
[![Travis Build Status](https://img.shields.io/travis/parro-it/spawn-shell/master.svg)](http://travis-ci.org/parro-it/spawn-shell)
[![NPM module](https://img.shields.io/npm/v/spawn-shell.svg)](https://npmjs.org/package/spawn-shell)
[![NPM downloads](https://img.shields.io/npm/dt/spawn-shell.svg)](https://npmjs.org/package/spawn-shell)

> Run shell commands using child_process#spawn.

# Features

* Multi-platform - run on OSX, Linux, Windows
* Return a promise that resolve with exitcode when spawned process terminetes
* Use `child_process#spawn` for greater flexibility than `child_process#exec`
* Use user system shell by default, or customize it via `shell` option.
* Inject your package `node_modules/.bin` directory in path.
* `stdio` spawn option defaults to `inherit`, sharing parent process stdin & stdout

# Installation

```bash
npm install --save spawn-shell
```

# Usage

```javascript
  const spawnShell = require('spawn-shell');

  // simple to use with promise
  const exitCode = await spawnShell('echo "it works" && exit 42').exitPromise;
  // output `it works` to stdout
  // exitCode === 42


  // access ChildProcess instance before promise is resolved
  const p = spawnShell('echo "it works"', {
    stdio: [0, 'pipe', 2]
  });

  p.stdout.pipe(concat(
    {encoding: 'string'},
    output => {
      // output === 'it works'
    }
  ));

```

# License

The MIT License (MIT)

Copyright (c) 2017 parro-it
