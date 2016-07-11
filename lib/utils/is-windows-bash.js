'use strict'
var isWindows = require('./is-windows.js')
module.exports = isWindows && /bash$/.test(process.env.SHELL)
