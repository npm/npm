
var tap = require("tap")
var toNerfDart = require('../../lib/config/nerf-dart');

function validNerfDart (uri, valid) {
  tap.test(uri, function (t) {
    t.plan(1);
    t.equal(toNerfDart(uri), valid);
    t.end();
  });
}

var valid = '//registry.npmjs.org/'

validNerfDart('http://registry.npmjs.org', valid);
validNerfDart('http://registry.npmjs.org/some-package', valid);
validNerfDart('http://registry.npmjs.org/some-package?write=true', valid);
validNerfDart('http://user:pass@registry.npmjs.org/some-package?write=true', valid);
validNerfDart('http://registry.npmjs.org/#random-hash', valid);
validNerfDart('http://registry.npmjs.org/some-package#random-hash', valid);
