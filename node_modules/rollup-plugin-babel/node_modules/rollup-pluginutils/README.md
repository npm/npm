# rollup-pluginutils

A set of functions commonly used by Rollup plugins.


## Installation

```bash
npm install --save rollup-pluginutils
```


## Usage

### addExtension

```js
import { addExtension } from 'rollup-pluginutils';

export default function myPlugin ( options = {} ) {
  return {
    resolveId ( code, id ) {
      // only adds an extension if there isn't one already
      id = addExtension( id ); // `foo` -> `foo.js`, `foo.js -> foo.js`
      id = addExtension( id, '.myext' ); // `foo` -> `foo.myext`, `foo.js -> `foo.js`
    }
  };
}
```


### attachScopes

This function attaches `Scope` objects to the relevant nodes of an AST. Each `Scope` object has a `scope.contains(name)` method that returns `true` if a given name is defined in the current scope or a parent scope.

See [rollup-plugin-inject](https://github.com/rollup/rollup-plugin-inject) or [rollup-plugin-commonjs](https://github.com/rollup/rollup-plugin-inject) for an example of usage.

```js
import { attachScopes } from 'rollup-pluginutils';
import { parse } from 'acorn';
import { walk } from 'estree-walker';

export default function myPlugin ( options = {} ) {
  return {
    transform ( code ) {
      const ast = parse( ast, {
        ecmaVersion: 6,
        sourceType: 'module'
      });

      let scope = attachScopes( ast, 'scope' );

      walk( ast, {
        enter ( node ) {
          if ( node.scope ) scope = node.scope;

          if ( !scope.contains( 'foo' ) ) {
            // `foo` is not defined, so if we encounter it,
            // we assume it's a global
          }
        },
        leave ( node ) {
          if ( node.scope ) scope = scope.parent;
        }
      });
    }
  };
}
```


### createFilter

```js
import { createFilter } from 'rollup-pluginutils';

export default function myPlugin ( options = {} ) {
  // `options.include` and `options.exclude` can each be a minimatch
  // pattern, or an array of minimatch patterns, relative to process.cwd()
  var filter = createFilter( options.include, options.exclude );

  return {
    transform ( code, id ) {
      // if `options.include` is omitted or has zero length, filter
      // will return `true` by default. Otherwise, an ID must match
      // one or more of the minimatch patterns, and must not match
      // any of the `options.exclude` patterns.
      if ( !filter( id ) ) return;

      // proceed with the transformation...
    }
  };
}
```


### makeLegalIdentifier

```js
import { makeLegalIdentifier } from 'rollup-pluginutils';

makeLegalIdentifier( 'foo-bar' ); // 'foo_bar'
makeLegalIdentifier( 'typeof' ); // '_typeof'
```


## License

MIT
