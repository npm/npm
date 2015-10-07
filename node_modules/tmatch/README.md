# tmatch

This module exists to facilitate the `t.match()` method in
[`tap`](http://npm.im/tap).

It checks whether a value matches a given "pattern".  A pattern is an
object with a set of fields that must be in the test object, or a
regular expression that a test string must match, or any combination
thereof.

The algorithm is borrowed heavily from
[`only-shallow`](http://npm.im/only-shallow), with some notable
differences with respect to the handling of missing properties and the
way that regular expressions are compared to strings.

## usage

```javascript
var matches = require('tmatch')

if (!matches(testObject, pattern)) console.log("yay! diversity!");

// somewhat more realistic example..
http.get(someUrl).on('response', function (res) {
  var expect = {
    statusCode: 200,
    headers: {
      server: /express/
    }
  }

  if (!tmatch(res, expect)) {
    throw new Error('Expect 200 status code from express server')
  }
})
```

## details

Copied from the source, here are the details of `only-shallow`'s algorithm:

1. If the object is a string, and the pattern is a RegExp, then return
   true if `pattern.test(object)`.
2. Use loose equality (`==`) only for all other value types
   (non-objects).  `tmatch` cares more about shape and contents than
   type. This step will also catch functions, with the useful
   (default) property that only references to the same function are
   considered equal.  'Ware the halting problem!
3. `null` *is* an object – a singleton value object, in fact – so if
   either is `null`, return object == pattern.
4. Since the only way to make it this far is for `object` or `pattern`
   to be an object, if `object` or `pattern` is *not* an object,
   they're clearly not a match.
5. It's much faster to compare dates by numeric value (`.getTime()`)
   than by lexical value.
6. Compare RegExps by their components, not the objects themselves.
7. The parts of an arguments list most people care about are the
   arguments themselves, not the callee, which you shouldn't be
   looking at anyway.
8. Objects are more complex:
   1. Return `true` if `object` and `pattern` both have no properties.
   2. Ensure that cyclical references don't blow up the stack.
   3. Ensure that all the key names in `pattern` exist in `object`.
   4. Ensure that all of the associated values match, recursively.

## license

ISC. Go nuts.
