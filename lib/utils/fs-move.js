'use strict'

var fs = require('fs')
var fsExtra = require('node-fs-extra')

var atomicMove = fs.rename
var nonAtomicMove = fsExtra.move

// npm tends to puke with EXDEV (cross-device links) in Docker containers;
// fallback to plain move semantics but at the cost of atomicity.
module.exports = process.env.NPM_DOCKER_COMPAT ? nonAtomicMove : atomicMove
