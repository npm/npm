var jsup = require('jsup');
var fs = require('fs');
var src = fs.readFileSync(__dirname + '/stub.json', 'utf8');

var s = jsup(src)
    .set([ 'a', 2 ], 3)
    .set([ 'c' ], 'lul')
    .stringify()
;
console.log(s);
