'use strict'
var isWindows = require('./is-windows.js')
var env = process.env
module.exports = isWindows && (env.MSYSTEM ? /^MINGW(32|64)$/.test(env.MSYSTEM) : env.TERM === "cygwin")
