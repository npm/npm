# function-loop

Run a list of functions in order in a given object context.  The
functions can be callback-taking or promise-returning.

This module is
[zalgo-exposing](http://blog.izs.me/post/59142742143/designing-apis-for-asynchrony),
meaning that synchronous calls to the cb functions will result in a
sync call to the supplied cb, and async calls will result in the cb
being called asynchronously.  It does not artificially defer if
callbacks are called synchronously.

## API

`loop(context, functionList, doneCallback, errorCallback)`

Run all the functions in the context of the `context` object, and then
call the `doneCallback` or call the `errorCallback` if there are any
errors.
