# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="3.0.3"></a>
## [3.0.3](https://github.com/moxystudio/node-promptly/compare/v3.0.2...v3.0.3) (2018-01-17)


### Bug Fixes

* add pify to package.json ([#20](https://github.com/moxystudio/node-promptly/issues/20)) ([b7a7c84](https://github.com/moxystudio/node-promptly/commit/b7a7c84))



<a name="3.0.2"></a>
## [3.0.2](https://github.com/moxystudio/node-promptly/compare/v3.0.1...v3.0.2) (2018-01-15)



<a name="3.0.1"></a>
## [3.0.1](https://github.com/moxystudio/node-promptly/compare/v3.0.0...v3.0.1) (2018-01-15)



<a name="3.0.0"></a>
# [3.0.0](https://github.com/moxystudio/node-promptly/compare/2.2.0...3.0.0) (2018-01-15)


### Chores

* update project to use new features present in node lts ([d3677d0](https://github.com/moxystudio/node-promptly/commit/d3677d0))


### BREAKING CHANGES

* remove support for old node versions (only latest lts or higher is supported)
* callback support has been removed
* ability to call error.retry has been removed
* built-in choice and confirm validators now run before any custom validators
* the default option value may only be undefined or a string from now on
