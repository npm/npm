var proxyquire = require('proxyquire');
module.exports = proxyquire('ncp', { 'fs': require('graceful-fs') });