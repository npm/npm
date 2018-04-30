# rollup-plugin-node-resolve changelog

## 3.0.4 (unreleased)

* Update lockfile [#137](https://github.com/rollup/rollup-plugin-node-resolve/issues/137)
* Update rollup dependency [#138](https://github.com/rollup/rollup-plugin-node-resolve/issues/138)
* Enable installation from Github [#142](https://github.com/rollup/rollup-plugin-node-resolve/issues/142)

## 3.0.3

* Fix [#130](https://github.com/rollup/rollup-plugin-node-resolve/issues/130) and [#131](https://github.com/rollup/rollup-plugin-node-resolve/issues/131)

## 3.0.2

* Ensure `pkg.browser` is an object if necessary ([#129](https://github.com/rollup/rollup-plugin-node-resolve/pull/129))

## 3.0.1

* Remove `browser-resolve` dependency ([#127](https://github.com/rollup/rollup-plugin-node-resolve/pull/127))

## 3.0.0

* [BREAKING] Remove `options.skip` ([#90](https://github.com/rollup/rollup-plugin-node-resolve/pull/90))
* Add `modulesOnly` option ([#96](https://github.com/rollup/rollup-plugin-node-resolve/pull/96))

## 2.1.1

* Prevent `jail` from breaking builds on Windows ([#93](https://github.com/rollup/rollup-plugin-node-resolve/issues/93))

## 2.1.0

* Add `jail` option ([#53](https://github.com/rollup/rollup-plugin-node-resolve/pull/53))
* Add `customResolveOptions` option ([#79](https://github.com/rollup/rollup-plugin-node-resolve/pull/79))
* Support symlinked packages ([#82](https://github.com/rollup/rollup-plugin-node-resolve/pull/82))

## 2.0.0

* Add support `module` field in package.json as an official alternative to jsnext

## 1.7.3

* Error messages are more descriptive ([#50](https://github.com/rollup/rollup-plugin-node-resolve/issues/50))

## 1.7.2

* Allow entry point paths beginning with ./

## 1.7.1

* Return a `name`

## 1.7.0

* Allow relative IDs to be external ([#32](https://github.com/rollup/rollup-plugin-node-resolve/pull/32))

## 1.6.0

* Skip IDs containing null character

## 1.5.0

* Prefer built-in options, but allow opting out ([#28](https://github.com/rollup/rollup-plugin-node-resolve/pull/28))

## 1.4.0

* Pass `options.extensions` through to `node-resolve`

## 1.3.0

* `skip: true` skips all packages that don't satisfy the `main` or `jsnext` options ([#16](https://github.com/rollup/rollup-plugin-node-resolve/pull/16))

## 1.2.1

* Support scoped packages in `skip` option ([#15](https://github.com/rollup/rollup-plugin-node-resolve/issues/15))

## 1.2.0

* Support `browser` field ([#8](https://github.com/rollup/rollup-plugin-node-resolve/issues/8))
* Get tests to pass on Windows

## 1.1.0

* Use node-resolve to handle various corner cases

## 1.0.0

* Add ES6 build, use Rollup 0.20.0

## 0.1.0

* First release
