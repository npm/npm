# own-or

Either use the object's own property, or a fallback

Useful for setting default values.

## API

`ownOr(object, key, fallback)`

## USAGE

```js
var ownOr = require('own-or')

var config = { some: 'configs' }

var foo = ownOr(config, 'bar', 'baz') // 'baz'
var some = ownOr(config, 'some', 'quux') // 'configs'
```
