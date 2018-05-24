# bind-obj-methods

Bind methods to an object from that object or some other source.
Optionally specify a set of methods to skip over.

Also binds non-enumerable methods, retaining their
non-enumerable-ness.

## API

`bindObjMethods(obj, [source], [omit])`

Bind all the methods from source onto obj, skipping over anything in
the `omit` list.  `omit` can be either an array or an object of
boolean values.  `source` defaults to `obj` if not specified.

## USAGE

```js
var bindObjMethods = require('bind-obj-methods')

var obj = {
  method: () => this.foo,
  foo: 'bar'
}

var m = obj.method
m() // undefined

bindObjMethods(obj)
m = obj.method
m() // 'bar'
```
