# cmd-shim

The cmd-shim used in npm.  Currently npm has this code inlined.  It wasn not originally written by me; I simply copied it from the npm repository.

## Installation

```
npm install cmd-shim
```

## API

### cmdShim(from, to, cb)

Create a cmd shim at `to` for the command line program at `from`.  e.g.

```javascript
var cmdShim = require('cmd-shim');
cmdShim(__dirname + '/cli.js', '/usr/bin/command-name', function (err) {
  if (err) throw err;
});
```

### cmdShim.ifExists(from, to, cb)

The same as above, but will just continue if the file does not exist.  Source:

```javascript
function cmdShimIfExists (from, to, cb) {
  fs.stat(from, function (er) {
    if (er) return cb()
    cmdShim(from, to, cb)
  })
}
```

## Logging

By default, [npmlog](https://npmjs.org/package/npmlog) is used for logging.  Log messages are written by default if it fails to write to the output directory.  You can disable the logging by calling:

```javascript
require('npmlog').level('silent');
```

## License

MIT