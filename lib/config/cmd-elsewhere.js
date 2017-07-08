var path = require('path')
var fs = require('fs');
var log = require('npmlog')

var npmconf = require('./core.js')
var cmdElseWhere = {}

Object.defineProperty(cmdElseWhere, 'cmdList', {
    get: function get() {
        try {
            var bin = path.resolve(npmconf.defaults.prefix, 'bin');
            var commands = fs.readdirSync(bin).filter(function(name) {
                return name.substring(0, 4) == 'npm-'
            }).map(function(name) {
                return name.substring(4, name.length)
            })
            return commands;
        } catch(ex) {
            // silently ignore error
            log.error('cmdElseWhere', ex.toString());
            return [];
        }
    }
});

module.exports = cmdElseWhere
