safe
----

A set of small tools to make loops and callbacks fail in ways that are
debugable.  Async recursion will no longer infinitely loop.  Sync while
loops won't infinite loop.  Callbacks that should only be called once will
die theatrically if they're called more than once.  And zalgo will not be
summoned.

```
var safe = require ('./lib/utils/safe.js')
```

### safe.while(maxIterations, condition, each, done)

```
var ii = 0
safe.while(1000, function (doMore) { doMore(ii<10) }, function (next) {
  if (++ii == 5) return next.stop()
  if (ii > 5) next('impossible!')
  next()
}, function (er) {
  if (er) return console.error(er)
  console.log('all done!', ii) // prints: all done! 5
})
```

* maxIterations _integer_
* condition _function (function (boolean))_
* each _function (function (er))_
* done _function (er)_

Call `each` as long as `condition` calls back with true, then call `done`.

If `maxIterations` is hit then done will be called with an error object of
code `ETOOMANYITERATIONS`.

The `condition` function _should_ call its callback with a boolean, but
whatever's passed will be used in a truthy context.

If the callback passed to `each` is called with an error then the loop will
exit and `done` will be called with that error.

The callback passed to each has a `stop` method. If it is called then the loop
will exit and `done` will be called. Calling this does not exit your function
so be sure to `return`.

### safe.whileSync(maxIterations, condition, each)

* maxIterations _integer_
* condition _function → boolean_
* each _function (stop)_

Call `each` as long as `condition` returns true.

If `mxIterations` is hit then throw an exception with a code of
`ETOOMANYITERATIONS`.

The `condition` function should return a boolean, but whatever it returns
will be used in a truthy context.

If the argument to the `each` function is called then the loop will stop
immediately at this point– it's like calling `break` in an ordinary while
loop.

### safe.defer(cb, args…)

* cb _function_

Calls `cb` with `args…` at the next opportunity– `setImmediate` or failing
that `process.nextTick`. It's kind of the async `Function.prototype.call`.

### safe.dezalgo(cb)

A very minimal dezalgo implementation

### safe.onlyOnce(cb)

Dezalgos `cb` AND ensures that it will only be called back at most one time.
An additional call results in an error being thrown with a code of
`EMORETHANONCE`.

### safe.once(cb)

A very minimal once implementation that ignores additional calls. This also
dezalgos the callback.

### safe.recurseLimit(maxDepth, maxCalls, func)

Restricts a recursive function `func` to a maximum recursion depth of
`maxDepth` and a maximum total number of iterations of `maxCalls`.


```
function fibR (n,a,b,cb) {
  process.nextTick(function () {
    if (n<=0) return cb(null, a)
    fibR(n-1,b,a+b, cb)
  })
}
function fib (n,cb) {
  fibR(n,0,1,cb)
}
```

```
var fibR = safe.recurseLimit(10,10, function fibR (n,a,b,$recurse$,cb) {
  process.nextTick(function () {
    if (n<=0) return cb(null, a)
    $recurse$(n-1,b,a+b, cb)
  })
}
function fib (n,cb) {
  fibR(n,0,1,cb)
}
```


### safe.recurseLimitSync(maxDepth, maxCalls, func)

```
function fibR (n,a,b) {
  return n>0 ? fibR(n-1,b,a+b) : a;
}
function fib (n) {
  return fibR(n,0,1)
}
```

would be rewritten as

```
var fibR = safe.recurseLimitSync(10, 10, function (n,a,b,$recurse$) {
  if (a==null) a = 0
  if (b==null) b = 1
  return n>0 ? $recurse$(n-1,b,a+b) : a;
})
function fib (n) {
  return fibR(n,0,1)
}
```
