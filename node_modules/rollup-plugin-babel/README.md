# rollup-plugin-babel

Seamless integration between Rollup and Babel.

## Why?

If you're using Babel to transpile your ES6/7 code and Rollup to generate a standalone bundle, you have a couple of options:

* run the code through Babel first, being careful to exclude the module transformer, or
* run the code through Rollup first, and *then* pass it to Babel.

Both approaches have disadvantages – in the first case, on top of the additional configuration complexity, you may end up with Babel's helpers (like `classCallCheck`) repeated throughout your code (once for each module where the helpers are used). In the second case, transpiling is likely to be slower, because transpiling a large bundle is much more work for Babel than transpiling a set of small files.

Either way, you have to worry about a place to put the intermediate files, and getting sourcemaps to behave becomes a royal pain.

Using Rollup with rollup-plugin-babel makes the process far easier.


## Installation

```bash
npm install --save-dev rollup-plugin-babel
```


## Usage

```js
import { rollup } from 'rollup';
import babel from 'rollup-plugin-babel';

rollup({
  entry: 'main.js',
  plugins: [
    babel({
      exclude: 'node_modules/**'
    })
  ]
}).then(...)
```

All options are as per the [Babel documentation](https://babeljs.io/), except the following:

   * `options.externalHelpers`: a boolean value indicating whether to bundle in the babel helpers
   * `options.include` and `options.exclude`: each a minimatch pattern, or array of minimatch patterns, which determine which files are transpiled by Babel (by default, all files are transpiled)
   * `options.externalHelpersWhitelist`: an array which gives explicit control over which babelHelper functions are allowed in the bundle (by default, every helper is allowed)

Babel will respect `.babelrc` files – this is generally the best place to put your configuration.

### External dependencies

Ideally, you should only be transforming your own source code, rather than running all of your external dependencies through Babel – hence the `exclude: 'node_modules/**'` in the example above. If you have a dependency that exposes untranspiled ES6 source code that doesn't run in your target environment, then you may need to break this rule, but it often causes problems with unusual `.babelrc` files or mismatched versions of Babel.

We encourage library authors not to distribute code that uses untranspiled ES6 features (other than modules) for this reason. Consumers of your library should *not* have to transpile your ES6 code, any more than they should have to transpile your CoffeeScript, ClojureScript or TypeScript.

Use `babelrc: false` to prevent Babel from using local (i.e. to your external dependencies) `.babelrc` files, relying instead on the configuration you pass in.


## Configuring Babel

**The following applies to Babel 6 only. If you're using Babel 5, do `npm i -D rollup-plugin-babel@1`, as version 2 and above no longer supports Babel 5**

```bash
npm install --save-dev babel-preset-es2015 babel-plugin-external-helpers
```

```js
// .babelrc
{
  "presets": [
    [
      "es2015",
      {
        "modules": false
      }
    ]
  ],
  "plugins": [
    "external-helpers"
  ]
}
```

### Modules

The `es2015` preset includes the [transform-es2015-modules-commonjs](http://babeljs.io/docs/plugins/transform-es2015-modules-commonjs/) plugin, which converts ES6 modules to CommonJS – preventing Rollup from working. Since Babel 6.3 it's possible to deactivate module transformation with `"modules": false`. So there is no need to use the old workaround with `babel-preset-es2015-rollup`, that work for Babel <6.13. Rollup will throw an error if this is incorrectly configured.

### Helpers

In some cases Babel uses *helpers* to avoid repeating chunks of code – for example, if you use the `class` keyword, it will use a `classCallCheck` function to ensure that the class is instantiated correctly.

By default, those helpers will be inserted at the top of the file being transformed, which can lead to duplication. It's therefore recommended that you use the `external-helpers` plugin, which is automatically included in the `es2015-rollup` preset. Rollup will combine the helpers in a single block at the top of your bundle.

Alternatively, if you know what you're doing, you can use the `transform-runtime` plugin. If you do this, use `runtimeHelpers: true`:

```js
rollup.rollup({
  ...,
  plugins: [
    babel({ runtimeHelpers: true })
  ]
}).then(...)
```

Finally, if you do not wish the babel helpers to be included in your bundle at all (but instead reference the global `babelHelpers` object), you may set the `externalHelpers` option to `true`:

```js
rollup.rollup({
  ...,
  plugins: [
    babel({
      plugins: ['external-helpers'],
      externalHelpers: true
    })
  ]
}).then(...)
```

## License

MIT
