# trivial-deferred

The most dead-simple trivial Deferred implementation

Uses bluebird if available, otherwise native promises.

## USAGE

```js
var Deferred = require('trivial-deferred')
var d = new Deferred
// promise is d.promise
// to make the promise reject, do d.reject(error)
// to make the promise resolve, do d.resolve(value)
```
