jsup
====

Update json strings in-place.

[![build status](https://secure.travis-ci.org/substack/jsup.png)](http://travis-ci.org/substack/jsup)

example
=======

stub
----

stub.json:

````javascript
{
    "a" : [   1,  2,  333333,  4   ] ,
    "b" : [ 3, 4, { "c" : [ 5, 6 ] } ],
    "c" :
      444444,
    "d" : null
}
````

stub.js:

````javascript
var jsup = require('jsup');
var fs = require('fs');
var src = fs.readFileSync(__dirname + '/stub.json', 'utf8');

var s = jsup(src)
    .set([ 'a', 2 ], 3)
    .set([ 'c' ], 'lul')
    .stringify()
;
console.log(s);
````

output:

    $ node stub.js
    {
        "a" : [   1,  2,  3,  4   ] ,
        "b" : [ 3, 4, { "c" : [ 5, 6 ] } ],
        "c" :
          "lul",
        "d" : null
    }

methods
=======

var jsup = require('jsup');

var j = jsup(src)
-----------------

Return a new jsup updater from the json string body `src`.

j.get(path=[])
--------------

Get the element at `path`.

j.set(path, value)
------------------

Replace the element at `path` with `value`, preserving indentation.

Right now `value` will be run through `JSON.stringify()` for the replacement.

There must be an element at `path` already or this method will throw.

j.stringify()
-------------

Return the new string source with modifications, preserving indentation.

install
=======

With [npm](http://npmjs.org) just do:

    npm install jsup
