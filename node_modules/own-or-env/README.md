# own-or-env

Use an objects own property, or an environment variable.  Optionally
treat as a boolean if the env should be set to 1 or 0.

## API

`ownOrEnv(object, field, env, boolean)`

Use the `object[field]` if it's an own property, otherwise use the
named environent variable.  If `boolean` is set to `true`, then cast
to a boolean flag.

## USAGE

```js
// will set doTheThing to true based on config.doThing, falling back
// to reading process.env.DO_THING, where '0' is treated as false.
var doTheThing = ownOrEnv(config, 'doThing', 'DO_THING', true)

// just treat this one as a string, not a boolean flag
var file = ownOrEnv(config, 'file', 'MY_FILE')
```
