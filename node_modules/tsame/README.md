# tsame

Verify that two objects are the same, for use in
[tap](http://www.node-tap.org/).  The less accepting cousin of
[tmatch](http://npm.im/tmatch).

This merges code originally found in
[only-shallow](http://npm.im/only-shallow) and
[deeper](http://npm.im/deeper).  See license file for more details.

## USAGE

```javascript
const tsame = require('tsame')

const obj1 = { foo: '1' }
const obj2 = { foo: 1 }

// nonstrict by default
assert(tsame(obj1, obj2))

// strictly the same, types and all
assert(!tsame.strict(obj1, obj2))
```

Pretty much what it says on the tin.
