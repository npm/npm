# rollup-plugin-babel changelog

## 3.0.3

* Drop babel7 support. Use 4.0.0-beta if you use babel 7
* Use "module" in addition to "jsnext:main" ([#150](https://github.com/rollup/rollup-plugin-babel/issues/150))
* Remove unused babel helpers namespace declaration & expression ([#164](https://github.com/rollup/rollup-plugin-babel/issues/164))

## 3.0.2

* Fix regression with Babel 6 ([#158](https://github.com/rollup/rollup-plugin-babel/issues/158))

## 3.0.1

* Wasn't working, fix bug with transform (not using es2015-classes for preflight check)

## 3.0.0

* Drop Node 0.10/0.12 (Use native `Object.assign`)
* Change `babel-core` to be a peerDependency
* Support `babel-core` v7 as well as a peerDep (no changes necessary)

## 2.7.1

* Prevent erroneous warnings about duplicated runtime helpers ([#105](https://github.com/rollup/rollup-plugin-babel/issues/105))
* Ignore `ignore` option in preflight check ([#102](https://github.com/rollup/rollup-plugin-babel/issues/102))
* Allow custom `moduleName` with `runtime-helpers` ([#95](https://github.com/rollup/rollup-plugin-babel/issues/95))

## 2.7.0

* Add `externalHelpersWhitelist` option ([#92](https://github.com/rollup/rollup-plugin-babel/pull/92))
* Ignore `only` option during preflight checks ([#98](https://github.com/rollup/rollup-plugin-babel/issues/98))
* Use `options.onwarn` if available ([#84](https://github.com/rollup/rollup-plugin-babel/issues/84))
* Update documentation and dependencies

## 2.6.1

* Return a `name`

## 2.6.0

* Use `\0` convention for helper module ID ([#64](https://github.com/rollup/rollup-plugin-babel/issues/64))

## 2.5.1

* Don't mutate `options.plugins` ([#47](https://github.com/rollup/rollup-plugin-babel/issues/47))

## 2.5.0

* Import `babelHelpers` rather than injecting them – allows `transform` function to be pure ([#rollup/658](https://github.com/rollup/rollup/pull/658#issuecomment-223876824))

## 2.4.0

* Add `externalHelpers` option ([#41](https://github.com/rollup/rollup-plugin-babel/pull/41))

## 2.3.9

* Do not rename Babel helpers ([#34](https://github.com/rollup/rollup-plugin-babel/pull/34))

## 2.3.8

* Create new version to (hopefully) solve bizarre CI issue

## 2.3.7

* Be less clever about renaming Babel helpers ([#19](https://github.com/rollup/rollup-plugin-babel/issues/19))

## 2.3.6

* Fix cache misses in preflight check ([#29](https://github.com/rollup/rollup-plugin-babel/pull/29))

## 2.3.5

* Use class transformer local to plugin, not project being built

## 2.3.4

* Ensure class transformer is present for preflight check, and only run check once per directory ([#23](https://github.com/rollup/rollup-plugin-babel/issues/23))

## 2.3.3

* Fix helper renaming ([#22](https://github.com/rollup/rollup-plugin-babel/issues/22))

## 2.3.1-2

* Include correct files in npm package

## 2.3.0

* Allow `transform-runtime` Babel plugin, if combined with `runtimeHelpers: true` option ([#17](https://github.com/rollup/rollup-plugin-babel/issues/17))
* More permissive handling of helpers – only warn if inline helpers are duplicated
* Handle plugins that change export patterns ([#18](https://github.com/rollup/rollup-plugin-babel/issues/18))

## 2.2.0

* Preflight checks are run per-file, to avoid configuration snafus ([#16](https://github.com/rollup/rollup-plugin-babel/issues/16))

## 2.1.0

* Generate sourcemaps by default

## 2.0.1

* Use object-assign ponyfill
* Add travis support
* Fix test

## 2.0.0

* Babel 6 compatible

## 1.0.0

* First release
