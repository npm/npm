# @iarna/cli

Some simple CLI scaffolding for promise returning applications.

## EXAMPLE

`example.js`
```js
require('@iarna/cli')(main)
  .boolean('silent')
  .boolean('exit')
  .boolean('error')
  .boolean('reject')
  .boolean('code50')
  .version()
  .help()

function main (opts, arg1, arg2, arg3) {
  if (!opts.silent) console.error('Starting up!')
  console.log('Got:', arg1, arg2, arg3)
  if (opts.exit) process.exit()
  if (opts.error) throw new Error('throw')
  if (opts.reject) return Promise.reject(new Error('reject'))
  if (opts.code50) return Promise.reject(50)
  return new Promise(resolve => setTimeout(resolve, 10000))
}
```

```console
$ node example hello there world
Starting up!
Got: hello there world
$ node example hello there world
Starting up!
Got: hello there world
^C
Abnormal exit: SIGINT
$ node example --silent hello there world
Got: hello there world
$ node example --silent hello there world --exit
Got: hello there world
Abnormal exit: Promises not resolved
$ node example --silent hello there world --error
Got: hello there world
Error: throw
    at main (/Users/rebecca/code/cli/example.js:11:25)
    at Immediate.setImmediate (/Users/rebecca/code/cli/app.js:38:32)
    at runCallback (timers.js:800:20)
    at tryOnImmediate (timers.js:762:5)
    at processImmediate [as _immediateCallback] (timers.js:733:5)
$ node example --silent hello there world --reject
Got: hello there world
Error: reject
    at main (/Users/rebecca/code/cli/example.js:12:42)
    at Immediate.setImmediate [as _onImmediate] (/Users/rebecca/code/cli/app.js:38:32)
    at runCallback (timers.js:800:20)
    at tryOnImmediate (timers.js:762:5)
    at processImmediate [as _immediateCallback] (timers.js:733:5)
$ node example --silent hello there world --code50
Got: hello there world
$ echo $?
50
```

## WHAT YOU GET

* `yargs` - The wrapper around the main function returns a yargs object, so
  you can configure it as usual.  The `argv` object is passed in as the
  first argument of your entry point function.  The rest of your positional
  arguments are passed in as the remaining function arguments.
* _exit without resolving warnings_ - If your program finishes without
  resolving its promises (like if it crashes hard or you process.exit, or you just don't resolve the promise ) then
  we warn about that.
* `update-notifier` - A default update notifier is setup for your app so
  users will learn about new versions when you publish them. Your app needs to
  have a name, version and bin entry in its `package.json`. (The bin entry
  needs to have the script using `@iarna/cli` in it for the update notifier
  to trigger.)
* If your entry point function rejects then that's reported with a stack
  trace (if the rejected value has `.stack`) else with the rejected value
  and your process will exit with an error code.

## WHAT ITS NOT

A full framework for writing cli apps.  You'll likely outgrow the error
handling pretty fast if this is anything beyond a little one off.  This
mostly exists to scratch my own itch.  I kept on writing this code and I
wanted to stop.  =D

## USAGE

### require('@iarna/cli')(entryPointFunction) → yargs

The module itself exports a function that you need to call with the name of
your main function.  Your main function is like `main` in C, it's the entry
point for your program.  It needs to return a promise that resolves when
your program completes.

Your entry point function can be named anything, but it needs to return a
promise and it takes arguments like this:

`main(opts, arg1, arg2, …, argn) → Promise`

The first `opts` argument is `yargs.argv` and the additional arguments are
from `argv._`, so `arg1 === argv._[0]`, `arg2 === argv._[1]` and so on.
