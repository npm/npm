# merge-options [![Build Status](https://travis-ci.org/schnittstabil/merge-options.svg?branch=master)](https://travis-ci.org/schnittstabil/merge-options) [![Coverage Status](https://coveralls.io/repos/schnittstabil/merge-options/badge.svg?branch=master&service=github)](https://coveralls.io/github/schnittstabil/merge-options?branch=master) [![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)


> Merge Option Objects

`merge-options` considers [plain objects](https://github.com/sindresorhus/is-plain-obj) as *Option Objects*, everything else as *Option Values*.

## Install

```
$ npm install --save merge-options
```

## Usage

```js
const mergeOptions = require('merge-options');

mergeOptions({foo: 0}, {bar: 1}, {baz: 2}, {bar: 3})
//=> {foo: 0, bar: 3, baz: 2}

mergeOptions({nested: {unicorns: 'none'}}, {nested: {unicorns: 'many'}})
//=> {nested: {unicorns: 'many'}}

mergeOptions({[Symbol.for('key')]: 0}, {[Symbol.for('key')]: 42})
//=> {Symbol(key): 42}
```

## API

### mergeOptions(option1, ...options)<br/>mergeOptions.call(config, option1, ...options)<br/>mergeOptions.apply(config, [option1, ...options])

`mergeOptions` recursively merges one or more *Option Objects* into a new one and returns that. The `options` are merged in order, thus *Option Values* of additional `options` take precedence over previous ones.

The merging does not alter the passed `option` arguments, taking roughly the following steps:
* recursively cloning<sup><a href="#note1">[1]</a></sup> *Option Objects* and [arrays](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray) until reaching *Option Values*
* copying<sup><a href="#note1">[1]</a></sup> references to *Option Values* to the result object


```js
const defaultOpts = {
	fn:      () => false,                  // functions are Option Values
	promise: Promise.reject(new Error()),  // all non-plain objects are Option Values
	array:   ['foo'],                      // arrays are Option Values
	nested:  {unicorns: 'none'}            // {…} is plain, therefore an Option Object
};

const opts = {
	fn:      () => true,                   // [1]
	promise: Promise.resolve('bar'),       // [2]
	array:   ['baz'],                      // [3]
	nested:  {unicorns: 'many'}            // [4]
};

mergeOptions(defaultOpts, opts)
//=>
{
	fn:      [Function],                   // === [1]
	promise: Promise { 'bar' },            // === [2]
	array:   ['baz'],                      // !== [3] (arrays are cloned)
	nested:  {unicorns: 'many'}            // !== [4] (Option Objects are cloned)
}
```

#### config

Type: `object`

##### config.concatArrays

Type: `boolean`<br/>Default: `false`

Concatenate arrays:

```js
mergeOptions({src: ['src/**']}, {src: ['test/**']})
//=> {src: ['test/**']}

// Via call
mergeOptions.call({concatArrays: true}, {src: ['src/**']}, {src: ['test/**']})
//=> {src: ['src/**', 'test/**']}

// Via apply
mergeOptions.apply({concatArrays: true}, [{src: ['src/**']}, {src: ['test/**']}])
//=> {src: ['src/**', 'test/**']}
```


## Related

* See [object-assign](https://github.com/sindresorhus/object-assign) if you need a ES2015 Object.assign() ponyfill
* See [deep-assign](https://github.com/sindresorhus/deep-assign) if you need to do Object.assign() recursively

## Notes

<ol>
	<li id="note1">copying and cloning take only enumerable own properties into account</li>
</ol>

## License

MIT © [Michael Mayer](http://schnittstabil.de)
