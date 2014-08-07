
Progress bar extracted from [yapm](https://github.com/rlidwka/yapm)

(it's disabled by default there, you can enable it with `yapm install --progress=true` or `yapm set progress true`).

Run `node test.js` to see it in action:

```sh
$ node test.js
 163 kB/s [0/3] [npm: 200 kB/1.1 MB] [connect: 117 kB/221 kB] [express: 56.0 kB/280 kB]
```

## Format:

```
Speed [Completed/Total] [Name1: Rcv1/Total1] [Name2: Rcv2/Total2] ...
```

Where:

- Speed - download speed (this could be very inflated by compression), and does not include http headers
- Completed - amount of completed http requests
- Total - total amount of pending or completed http requests
- NameX - the name of the request (it is set by add function)
- RcvX - amount of received bytes in the request
- TotalX - total amount of bytes to get in the request

## Usage:

```js
var request = require('request')

require('yapm-progress')
  .enable(true)
  .intercept(process.stderr)
  .intercept(process.stdout)
  .output(process.stderr)
  .add('npm', request('https://registry.npmjs.org/npm'))
  .add('express', request('https://registry.npmjs.org/express'))
  .add('connect', request('https://registry.npmjs.org/connect'))
```

## API:

### add(name, request)

Track a new request.

### enable(interval)

If argument is `true`/`false` - enable or disable progress bar respectively.

If argument is a number - enable progress bar with specified refresh interval in milliseconds (100 is the default).

### intercept(stream)

Intercept all stream.write calls, and whenever someone is calling it, do an update().

### output(stream)

Set stream where progress bar will be displayed.

### update()

Refresh progress bar.

