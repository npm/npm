var jsup = require('../');
var test = require('tap').test;
var fs = require('fs');

var src = fs.readFileSync(__dirname + '/stub.json', 'utf8');

test('stub', function (t) {
    t.equal(jsup(src).stringify(), src);
    
    t.equal(
        jsup(src)
            .set([ 'a', 2 ], 'Three')
            .stringify()
        ,
        src.replace('"three"', '"Three"')
    );
    
    t.equal(
        jsup(src)
            .set([ 'a', 2 ], 'Three')
            .set([ 'c' ], 'lul')
            .stringify()
        ,
        src.replace('three', 'Three').replace('444444', '"lul"')
    );
    
    t.end();
});

test('get', function (t) {
    var js = jsup(src)
        .set([ 'a', 2 ], 3)
        .set([ 'c' ], 'lul')
    ;
    t.equal(js.get([ 'a', 0 ]), 1);
    t.equal(js.get([ 'a', 1 ]), 2);
    t.equal(js.get([ 'a', 2 ]), 3);
    t.same(js.get([ 'a' ]), [ 1, 2, 3 ]);
    
    t.equal(js.get([ 'c' ]), 'lul');
    t.ok(js.get([ 'd' ]) === null);
    
    t.same(
        js.get([]),
        {
            a : [ 1, 2, 3 ],
            b : [ 3, 4, { c : [ 5, 6 ] } ],
            c : 'lul',
            d : null
        }
    );
    
    t.same(
        js.get(),
        {
            a : [ 1, 2, 3 ],
            b : [ 3, 4, { c : [ 5, 6 ] } ],
            c : 'lul',
            d : null
        }
    );
    
    t.end();
});
