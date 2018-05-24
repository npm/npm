# yapool

Yet Another object pool in JavaScript

Because [yallist](http://npm.im/yallist) is sometimes too featureful,
this is a very dead-simple linked-list pool thingie in JavaScript that
lets you add and remove objects in a set.

Not suitable for very long lists, because all searches are `O(n)`, but
for small `n`, it has very low complexity.

## API

`p = new Pool()`

Constructor takes no arguments

`p.add(someObject)`

put an object in the pool

`p.length`

return the number of things in the pool.

`p.remove(someObject)`

remove that object from the pool.
