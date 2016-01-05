'use strict'
var npm = require('../npm.js')
exports.onlyProd = /^prod(uction)?$/.test(npm.config.get('only')) || npm.config.get('production')
exports.alsoProd = /^prod(uction)?$/.test(npm.config.get('also'))
exports.onlyDev = /^dev(elopment)?$/.test(npm.config.get('only'))
exports.alsoDev = /^dev(elopment)?$/.test(npm.config.get('also')) || npm.config.get('dev')
