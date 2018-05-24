[![Build Status](https://travis-ci.org/apache/couchdb-nano.svg?branch=master)](https://travis-ci.org/apache/couchdb-nano)![Coverage](https://img.shields.io/badge/coverage-100%-ff69b4.svg)[![dependencies Status](https://david-dm.org/apache/couchdb-nano/status.svg)](https://david-dm.org/apache/couchdb-nano)[![NPM](http://img.shields.io/npm/v/nano.svg?style=flat-square)](https://www.npmjs.com/package/nano)

# Nano

Offical [Apache CouchDB](http://couchdb.apache.org/) library for [Node.js](https://nodejs.org/).

Features:

* **Minimalistic** - There is only a minimum of abstraction between you and
  CouchDB.
* **Pipes** - Proxy requests from CouchDB directly to your end user.
* **Errors** - Errors are proxied directly from CouchDB: if you know CouchDB
  you already know `nano`.

## Installation

1. Install [npm][1]
2. `npm install nano`

or save `nano` as a dependency of your project with

    npm install --save nano

Note the minimum required version of Node.js is 6.

## Table of contents

- [Getting started](#getting-started)
- [Tutorials & screencasts](#tutorials-examples-in-the-wild--screencasts)
- [Configuration](#configuration)
- [Database functions](#database-functions)
  - [nano.db.create(name, [callback])](#nanodbcreatename-callback)
  - [nano.db.get(name, [callback])](#nanodbgetname-callback)
  - [nano.db.destroy(name, [callback])](#nanodbdestroyname-callback)
  - [nano.db.list([callback])](#nanodblistcallback)
  - [nano.db.compact(name, [designname], [callback])](#nanodbcompactname-designname-callback)
  - [nano.db.replicate(source, target, [opts], [callback])](#nanodbreplicatesource-target-opts-callback)
  - [nano.db.replication.enable(source, target, [opts], [callback])](#nanodbreplicationenablesource-target-opts-callback)
  - [nano.db.replication.query(id, [opts], [callback])](#nanodbreplicationenablesource-target-opts-callback)
  - [nano.db.replication.disable(id, [opts], [callback])](#nanodbreplicationdisableid-opts-callback)
  - [nano.db.changes(name, [params], [callback])](#nanodbchangesname-params-callback)
  - [nano.db.follow(name, [params], [callback])](#nanodbfollowname-params-callback)
  - [nano.db.info([callback])](#nanodbinfocallback)
  - [nano.use(name)](#nanousename)
  - [nano.request(opts, [callback])](#nanorequestopts-callback)
  - [nano.config](#nanoconfig)
  - [nano.updates([params], [callback])](#nanoupdatesparams-callback)
  - [nano.followUpdates([params], [callback])](#nanofollowupdatesparams-callback)
- [Document functions](#document-functions)
  - [db.insert(doc, [params], [callback])](#dbinsertdoc-params-callback)
  - [db.destroy(docname, rev, [callback])](#dbdestroydocname-rev-callback)
  - [db.get(docname, [params], [callback])](#dbgetdocname-params-callback)
  - [db.head(docname, [callback])](#dbheaddocname-callback)
  - [db.copy(src_doc, dest_doc, opts, [callback])](#dbcopysrc_doc-dest_doc-opts-callback)
  - [db.bulk(docs, [params], [callback])](#dbbulkdocs-params-callback)
  - [db.list([params], [callback])](#dblistparams-callback)
  - [db.fetch(docnames, [params], [callback])](#dbfetchdocnames-params-callback)
  - [db.fetchRevs(docnames, [params], [callback])](#dbfetchrevsdocnames-params-callback)
  - [db.createIndex(indexDef, [callback])](#dbcreateindexindexdef-callback)
- [Multipart functions](#multipart-functions)
  - [db.multipart.insert(doc, attachments, [params], [callback])](#dbmultipartinsertdoc-attachments-params-callback)
  - [db.multipart.get(docname, [params], [callback])](#dbmultipartgetdocname-params-callback)
- [Attachments functions](#attachments-functions)
  - [db.attachment.insert(docname, attname, att, contenttype, [params], [callback])](#dbattachmentinsertdocname-attname-att-contenttype-params-callback)
  - [db.attachment.get(docname, attname, [params], [callback])](#dbattachmentgetdocname-attname-params-callback)
  - [db.attachment.destroy(docname, attname, [params], [callback])](#dbattachmentdestroydocname-attname-rev-callback)
- [Views and design functions](#views-and-design-functions)
  - [db.view(designname, viewname, [params], [callback])](#dbviewdesignname-viewname-params-callback)
  - [db.show(designname, showname, doc_id, [params], [callback])](#dbshowdesignname-showname-doc_id-params-callback)
  - [db.atomic(designname, updatename, docname, [body], [callback])](#dbatomicdesignname-updatename-docname-body-callback)
  - [db.search(designname, viewname, [params], [callback])](#dbsearchdesignname-searchname-params-callback)
- [Using cookie authentication](#using-cookie-authentication)
- [Advanced features](#advanced-features)
  - [getting uuids](#getting-uuids)
  - [extending nano](#extending-nano)
  - [pipes](#pipes)
- [Tests](#tests)
- [Release](#release)

## Getting started

To use `nano` you need to connect it to your CouchDB install, to do that:

``` js
var nano = require('nano')('http://localhost:5984');
```

The URL you supply may also contain authenication credentials e.g. `http://admin:mypassword@localhost:5984`.

To create a new database:

``` js
nano.db.create('alice');
```

and to use an existing database:

``` js
var alice = nano.db.use('alice');
```

In this examples we didn't specify a `callback` function, the absence of a
callback means _"do this, ignore what happens"_.

In `nano` the callback function receives always three arguments:

* `err` - The error, if any.
* `body` - The HTTP _response body_ from CouchDB, if no error.
  JSON parsed body, binary for non JSON responses.
* `header` - The HTTP _response header_ from CouchDB, if no error.


A simple but complete example using callbacks is:

``` js
var nano = require('nano')('http://localhost:5984');

// clean up the database we created previously
nano.db.destroy('alice', function() {
  // create a new database
  nano.db.create('alice', function() {
    // specify the database we are going to use
    var alice = nano.use('alice');
    // and insert a document in it
    alice.insert({ happy: true }, 'rabbit', function(err, body, header) {
      if (err) {
        console.log('[alice.insert] ', err.message);
        return;
      }
      console.log('you have inserted the rabbit.')
      console.log(body);
    });
  });
});
```

If you run this example (after starting CouchDB) you will see:

```
you have inserted the rabbit.
{ ok: true,
  id: 'rabbit',
  rev: '1-6e4cb465d49c0368ac3946506d26335d' }
```

You can also see your document in [futon](http://localhost:5984/_utils).

## Promises

Although `nano` is written using the "callback" style, it is easy enough to switch to a "Promises" style, using the [Bluebird](https://www.npmjs.com/package/bluebird) library:

```js
var Promise = require('bluebird');
var mydb = require('nano')('http://localhost:5984/animaldb');

// create Promise-compatible versions of all functions
Promise.promisifyAll(mydb);

// now we have "get" (callback compatible) and "getAsync" (Promise compatible)
animals.getAsync('doc1').then(function(doc) {
  console.log('the doc is', doc);
}).catch(console.error);
```

## Configuration

Configuring nano to use your database server is as simple as:

``` js
var nano = require('nano')('http://localhost:5984'),
  db = nano.use('foo');
```

If you don't need to instrument database objects you can simply:

``` js
// nano parses the URL and knows this is a database
var db = require('nano')('http://localhost:5984/foo');
```

You can also pass options to the require to specify further configuration options you can pass an object literal instead:

``` js
// nano parses the URL and knows this is a database
var opts = {
  url: "http://localhost:5984/foo",
  requestDefaults: { "proxy" : "http://someproxy" },
  log: function(id, args) {
    console.log(id, args);
  }
};
var db = require('nano')(opts);
```

Please check [request] for more information on the defaults. They support features like cookie jar, proxies, ssl, etc.

You can tell nano to not parse the URL (maybe the server is behind a proxy, is accessed through a rewrite rule or other):

```js
// nano does not parse the URL and return the server api
// "http://localhost:5984/prefix" is the CouchDB server root
var couch = require('nano')(
  { url : "http://localhost:5984/prefix"
    parseUrl : false
  });
var db = couch.use('foo');
```

### Pool size and open sockets

A very important configuration parameter if you have a high traffic website and are using `nano` is setting up the `pool.size`. By default, the Node.js HTTP global agent (client) has a certain size of active connections that can run simultaneously, while others are kept in a queue. Pooling can be disabled by setting the `agent` property in `requestDefaults` to `false`, or adjust the global pool size using:

``` js
http.globalAgent.maxSockets = 20;
```

You can also increase the size in your calling context using `requestDefaults` if this is problematic. Refer to the [request] documentation and examples for further clarification.

Here's an example explicitly using the keep alive agent (installed using `npm install agentkeepalive`), especially useful to limit your open sockets when doing high-volume access to CouchDB on localhost:

``` js
var agentkeepalive = require('agentkeepalive');
var myagent = new agentkeepalive({
  maxSockets: 50,
  maxKeepAliveRequests: 0,
  maxKeepAliveTime: 30000
});

var db = require('nano')(
  { url: "http://localhost:5984/foo",
    requestDefaults : { "agent" : myagent }
  });
```

## Database functions

### nano.db.create(name, [callback])

Creates a CouchDB database with the given `name`:

``` js
nano.db.create('alice', function(err, body) {
  if (!err) {
    console.log('database alice created!');
  }
});
```

### nano.db.get(name, [callback])

Get information about the database `name`:

``` js
nano.db.get('alice', function(err, body) {
  if (!err) {
    console.log(body);
  }
});
```

### nano.db.destroy(name, [callback])

Destroys the database `name`:

``` js
nano.db.destroy('alice', function(err, body){
});
```

### nano.db.list([callback])

Lists all the CouchDB databases:

``` js
nano.db.list(function(err, body) {
  // body is an array
  body.forEach(function(db) {
    console.log(db);
  });
});
```

### nano.db.compact(name, [designname], [callback])

Compacts `name`, if `designname` is specified also compacts its views.

### nano.db.replicate(source, target, [opts], [callback])

Replicates `source` to `target` with options `opts`. The `target`database
has to exist, add `create_target:true` to `opts` to create it prior to
replication:

``` js
nano.db.replicate('alice', 'http://admin:password@otherhost.com:5984/alice',
                  { create_target:true }, function(err, body) {
    if (!err)
      console.log(body);
});
```

### nano.db.replication.enable(source, target, [opts], [callback])

Enables replication using the new CouchDB api from `source` to `target`
with options `opts`. `target` has to exist, add `create_target:true` to
`opts` to create it prior to replication. Replication will survive server restarts.

``` js
nano.db.replication.enable('alice', 'http://admin:password@otherhost.com:5984/alice',
                  { create_target:true }, function(err, body) {
    if (!err)
      console.log(body);
});
```

### nano.db.replication.query(id, [opts], [callback])

Queries the state of replication using the new CouchDB API. The `id` comes from the response
given by the call to `replication.enable`:

``` js
nano.db.replication.enable('alice', 'http://admin:password@otherhost.com:5984/alice',
                   { create_target:true }, function(err, body) {
    if (!err) {
      nano.db.replication.query(body.id, function(error, reply) {
        if (!err)
          console.log(reply);
      }
    }
});
```

### nano.db.replication.disable(id, [opts], [callback])

Disables replication using the new CouchDB API. The `id` comes from the response given
by the call to `replication.enable`:

``` js
nano.db.replication.enable('alice', 'http://admin:password@otherhost.com:5984/alice',
                   { create_target:true }, function(err, body) {
    if (!err) {
      nano.db.replication.disable(body.id, function(error, reply) {
        if (!err)
          console.log(reply);
      }
    }
});
```

### nano.db.changes(name, [params], [callback])

Asks for the changes feed of `name`, `params` contains additions
to the query string.

``` js
nano.db.changes('alice', function(err, body) {
  if (!err) {
    console.log(body);
  }
});
```

### nano.db.follow(name, [params], [callback])

Uses [Follow] to create a solid changes feed. Please consult `follow` documentation for more information as this is a very complete API on it's own:

``` js
var feed = db.follow({since: "now"});
feed.on('change', function (change) {
  console.log("change: ", change);
});
feed.follow();
process.nextTick(function () {
  db.insert({"bar": "baz"}, "bar");
});
```

### nano.db.info([callback])

Gets database information:

```js
nano.db.info(function(err, body) {
  if (!err) {
    console.log('got database info', body);
  }
});
```

### nano.use(name)

Returns a database object that allows you to perform operations against that database:

``` js
var alice = nano.use('alice');
alice.insert({ happy: true }, 'rabbit', function(err, body) {
  // do something
});
```

### nano.db.use(name)

Alias for `nano.use`

### nano.db.scope(name)

Alias for `nano.use`

### nano.scope(name)

Alias for `nano.use`

### nano.request(opts, [callback])

Makes a custom request to CouchDB. This can be used to create your own HTTP request to the CouchDB
server, to perform operations where there is no `nano` function that encapsulates it. The available `opts` are:

* `opts.db` – the database name
* `opts.method` – the http method, defaults to `get`
* `opts.path` – the full path of the request, overrides `opts.doc` and
  `opts.att`
* `opts.doc` – the document name
* `opts.att` – the attachment name
* `opts.qs` – query string parameters, appended after any existing `opts.path`, `opts.doc`, or `opts.att`
* `opts.content_type` – the content type of the request, default to `json`
* `opts.headers` – additional http headers, overrides existing ones
* `opts.body` – the document or attachment body
* `opts.encoding` – the encoding for attachments
* `opts.multipart` – array of objects for multipart request

### nano.relax(opts, [callback])

Alias for `nano.request`

### nano.config

An object containing the `nano` configurations, possible keys are:

* `url` - the CouchDB URL
* `db` - the database name

### nano.updates([params], [callback])

Listen to db updates, the available `params` are:

* `params.feed` – Type of feed. Can be one of
 * `longpoll`: Closes the connection after the first event.
 * `continuous`: Send a line of JSON per event. Keeps the socket open until timeout.
 * `eventsource`: Like, continuous, but sends the events in EventSource format.
* `params.timeout` – Number of seconds until CouchDB closes the connection. Default is 60.
* `params.heartbeat` – Whether CouchDB will send a newline character (\n) on timeout. Default is true.

### nano.followUpdates([params], [callback])

** changed in version 6 **

Use [Follow](https://github.com/jhs/follow) to create a solid
[`_db_updates`](http://docs.couchdb.org/en/latest/api/server/common.html?highlight=db_updates#get--_db_updates) feed.
Please consult follow documentation for more information as this is a very complete api on it's own

```js
var feed = nano.followUpdates({since: "now"});
feed.on('change', function (change) {
  console.log("change: ", change);
});
feed.follow();
process.nextTick(function () {
  nano.db.create('alice');
});
```

## Document functions

### db.insert(doc, [params], [callback])

Inserts `doc` in the database with optional `params`. If params is a string, it's assumed it is the intended document `_id`. If params is an object, it's passed as query string parameters and `docName` is checked for defining the document `_id`:

``` js
var alice = nano.use('alice');
alice.insert({ happy: true }, 'rabbit', function(err, body) {
  if (!err)
    console.log(body);
});
```

The `insert` function can also be used with the method signature `db.insert(doc,[callback])`, where the `doc` contains the `_id` field e.g.

```js
var alice = nano.use('alice')
alice.insert({ _id: 'myid', happy: true }, function(err, body) {
  if (!err)
    console.log(body)
})
```

and also used to update an existing document, by including the `_rev` token in the document being saved:

```js
var alice = nano.use('alice')
alice.insert({ _id: 'myid', _rev: '1-23202479633c2b380f79507a776743d5', happy: false }, function(err, body) {
  if (!err)
    console.log(body)
})
```

### db.destroy(docname, rev, [callback])

Removes a document from CouchDB whose `_id` is `docname` and who's revision is `_rev`:

``` js
alice.destroy('rabbit', '3-66c01cdf99e84c83a9b3fe65b88db8c0', function(err, body) {
  if (!err)
    console.log(body);
});
```

### db.get(docname, [params], [callback])

Gets a document from CouchDB whose `_id` is `docname`:

``` js
alice.get('rabbit', function(err, body) {
  console.log(body);
});
```

or with optional query string `params`:

``` js
alice.get('rabbit', { revs_info: true }, function(err, body) {
  console.log(body);
});
```

### db.head(docname, [callback])

Same as `get` but lightweight version that returns headers only:

``` js
alice.head('rabbit', function(err, _, headers) {
  if (!err)
    console.log(headers);
});
```

### db.copy(src_doc, dest_doc, opts, [callback])

Copies the contents (and attachments) of a document
to a new document, or overwrite an existing target document

``` js
alice.copy('rabbit', 'rabbit2', { overwrite: true }, function(err, _, headers) {
  if (!err)
    console.log(headers);
});
```

### db.bulk(docs, [params], [callback])

Bulk operations(update/delete/insert) on the database, refer to the
[CouchDB doc](http://wiki.apache.org/couchdb/HTTP_Bulk_Document_API) e.g:

``` js
var documents = [
  { a:1, b:2 },
  { _id: 'tiger', striped: true}
];
alice.bulk({docs:documents}, function(err, body) {
  console.log(body);
});
```

### db.list([params], [callback])

List all the docs in the database .

``` js
alice.list(function(err, body) {
  if (!err) {
    body.rows.forEach(function(doc) {
      console.log(doc);
    });
  }
});
```

or with optional query string additions `params`:

``` js
alice.list({include_docs: true}, function(err, body) {
  if (!err) {
    body.rows.forEach(function(doc) {
      // output eacj document's body
      console.log(doc.doc);
    });
  }
});
```

### db.fetch(docnames, [params], [callback])

Bulk fetch of the database documents, `docnames` are specified as per
[CouchDB doc](http://docs.couchdb.org/en/latest/api/database/bulk-api.html#post--db-_all_docs).
additional query string `params` can be specified, `include_docs` is always set
to `true`.

```js
var keys = ['tiger', 'zebra', 'donkey'];
alice.fetch({keys: keys}, function(err, data) {
  console.log(data);
});
```

### db.fetchRevs(docnames, [params], [callback])

** changed in version 6 **

Bulk fetch of the revisions of the database documents, `docnames` are specified as per
[CouchDB doc](http://docs.couchdb.org/en/latest/api/database/bulk-api.html#post--db-_all_docs).
additional query string `params` can be specified, this is the same method as fetch but
 `include_docs` is not automatically set to `true`.

### db.createIndex(indexDef, [callback])

Create index on database fields, as specified in
[CouchDB doc](http://docs.couchdb.org/en/latest/api/database/find.html#db-index).

```js
var indexDef = {
  index: { fields: ['foo'] },
  name: 'fooindex'
};
alice.createIndex(indexDef, function(err, result) {
  console.log(result);
});
```

## Multipart functions

### db.multipart.insert(doc, attachments, params, [callback])

Inserts a `doc` together with `attachments` and `params`. If params is a string, it's assumed as the intended document `_id`. If params is an object, its passed as query string parameters and `docName` is checked for defining the `_id`. Refer to the [doc](http://wiki.apache.org/couchdb/HTTP_Document_API#Multiple_Attachments) for more details.
 The `attachments` parameter must be an array of objects with `name`, `data` and `content_type` properties.

``` js
var fs = require('fs');

fs.readFile('rabbit.png', function(err, data) {
  if (!err) {
    alice.multipart.insert({ foo: 'bar' }, [{name: 'rabbit.png', data: data, content_type: 'image/png'}], 'mydoc', function(err, body) {
        if (!err)
          console.log(body);
    });
  }
});
```

### db.multipart.get(docname, [params], [callback])

Get `docname` together with its attachments via `multipart/related` request with optional query string additions `params`. Refer to the
 [doc](http://wiki.apache.org/couchdb/HTTP_Document_API#Getting_Attachments_With_a_Document) for more details. The multipart response body is a `Buffer`.

``` js
alice.multipart.get('rabbit', function(err, buffer) {
  if (!err)
    console.log(buffer.toString());
});
```

## Attachments functions

### db.attachment.insert(docname, attname, att, contenttype, [params], [callback])

Inserts an attachment `attname` to `docname`, in most cases
 `params.rev` is required. Refer to the
 [doc](http://wiki.apache.org/couchdb/HTTP_Document_API) for more details.

``` js
var fs = require('fs');

fs.readFile('rabbit.png', function(err, data) {
  if (!err) {
    alice.attachment.insert('rabbit', 'rabbit.png', data, 'image/png',
      { rev: '12-150985a725ec88be471921a54ce91452' }, function(err, body) {
        if (!err)
          console.log(body);
    });
  }
});
```

or using `pipe`:

``` js
var fs = require('fs');

fs.createReadStream('rabbit.png').pipe(
    alice.attachment.insert('new', 'rab.png', null, 'image/png')
);
```

### db.attachment.get(docname, attname, [params], [callback])

Get `docname`'s attachment `attname` with optional query string additions
`params`.

``` js
var fs = require('fs');

alice.attachment.get('rabbit', 'rabbit.png', function(err, body) {
  if (!err) {
    fs.writeFile('rabbit.png', body);
  }
});
```

or using `pipe`:

``` js
var fs = require('fs');

alice.attachment.get('rabbit', 'rabbit.png').pipe(fs.createWriteStream('rabbit.png'));
```

### db.attachment.destroy(docname, attname, [params], [callback])

**changed in version 6**

Destroy attachment `attname` of `docname`'s revision `rev`.

``` js
alice.attachment.destroy('rabbit', 'rabbit.png',
    {rev: '1-4701d73a08ce5c2f2983bf7c9ffd3320'}, function(err, body) {
      if (!err)
        console.log(body);
});
```

## Views and design functions

### db.view(designname, viewname, [params], [callback])

Calls a view of the specified `designname` with optional query string `params`. If you're looking to filter the view results by key(s) pass an array of keys, e.g
`{ keys: ['key1', 'key2', 'key_n'] }`, as `params`.

``` js
alice.view('characters', 'happy_ones', {
  'key': 'Tea Party',
  'include_docs': true
}, function(err, body) {
  if (!err) {
    body.rows.forEach(function(doc) {
      console.log(doc.value);
    });
  }
});
```

or

``` js
alice.view('characters', 'soldiers', {
  'keys': ['Hearts', 'Clubs']
}, function(err, body) {
  if (!err) {
    body.rows.forEach(function(doc) {
      console.log(doc.value);
    });
  }
});
```

When `params` is not supplied, or no keys are specified, it will simply return all documents in the view:

``` js
alice.view('characters', 'happy_ones', function(err, body) {
  if (!err) {
    body.rows.forEach(function(doc) {
      console.log(doc.value);
    });
  }
});
```

``` js
alice.view('characters', 'happy_ones', { include_docs: true }, function(err, body) {
  if (!err) {
    body.rows.forEach(function(doc) {
      console.log(doc.value);
    });
  }
});
```

### db.viewWithList(designname, viewname, listname, [params], [callback])

Calls a list function fed by the given view from the specified design document.

``` js
alice.viewWithList('characters', 'happy_ones', 'my_list', function(err, body) {
  if (!err) {
    console.log(body);
  }
});
```

### db.show(designname, showname, doc_id, [params], [callback])

Calls a show function from the specified design for the document specified by doc_id with
optional query string additions `params`.

``` js
alice.show('characters', 'format_doc', '3621898430', function(err, doc) {
  if (!err) {
    console.log(doc);
  }
});
```

Take a look at the [couchdb wiki](http://wiki.apache.org/CouchDB/Formatting_with_Show_and_List#Showing_Documents)
for possible query paramaters and more information on show functions.

### db.atomic(designname, updatename, docname, [body], [callback])

Calls the design's update function with the specified doc in input.

``` js
db.atomic("update", "inplace", "foobar",
{field: "foo", value: "bar"}, function (error, response) {
  assert.equal(error, undefined, "failed to update");
  assert.equal(response.foo, "bar", "update worked");
});
```

Note that the data is sent in the body of the request.
An example update handler follows:

``` js
"updates": {
  "in-place" : "function(doc, req) {
      var field = req.form.field;
      var value = req.form.value;
      var message = 'set '+field+' to '+value;
      doc[field] = value;
      return [doc, message];
  }"
```

### db.search(designname, searchname, [params], [callback])

Calls a view of the specified design with optional query string additions `params`.

``` js
alice.search('characters', 'happy_ones', { q: 'cat' }, function(err, doc) {
  if (!err) {
    console.log(doc);
  }
});
```

Check out the tests for a fully functioning example.

## using cookie authentication

Nano supports making requests using CouchDB's [cookie authentication](http://guide.couchdb.org/editions/1/en/security.html#cookies) functionality. There's an [example in coffeescript](http://stackoverflow.com/questions/23100132/using-nano-auth-correctly), but essentially you just:

``` js
var nano     = require('nano')('http://localhost:5984'),
  username = 'user',
  userpass = 'pass',
  callback = console.log, // this would normally be some callback
  cookies  = {}; // store cookies, normally redis or something


nano.auth(username, userpass, function (err, body, headers) {
  if (err) {
    return callback(err);
  }

  if (headers && headers['set-cookie']) {
    cookies[user] = headers['set-cookie'];
  }

  callback(null, "it worked");
});
```

Reusing a cookie:

``` js
var auth = "some stored cookie",
  callback = console.log, // this would normally be some callback
  alice = require('nano')(
    { url : 'http://localhost:5984/alice', cookie: 'AuthSession=' + auth });

alice.insert(doc, function (err, body, headers) {
  if (err) {
    return callback(err);
  }

  // change the cookie if CouchDB tells us to
  if (headers && headers['set-cookie']) {
    auth = headers['set-cookie'];
  }

  callback(null, "it worked");
});
```

Getting current session:

```javascript
var nano = require('nano')({url: 'http://localhost:5984', cookie: 'AuthSession=' + auth});

nano.session(function(err, session) {
  if (err) {
    return console.log('oh noes!')
  }

  console.log('user is %s and has these roles: %j',
    session.userCtx.name, session.userCtx.roles);
});
```

## Advanced features

### Getting uuids

If your application needs to generate UUIDs, then CouchDB can provide some for you

```js
nano.uuids(3, callback);
// { uuid: [
// '5d1b3ef2bc7eea51f660c091e3dffa23',
// '5d1b3ef2bc7eea51f660c091e3e006ff',
// '5d1b3ef2bc7eea51f660c091e3e007f0',
//]}
```

The first parameter is the number of uuids to generate. If omitted, it defaults to 1.

### Extending nano

`nano` is minimalistic but you can add your own features with
`nano.request(opts, callback)`

For example, to create a function to retrieve a specific revision of the
`rabbit` document:

``` js
function getrabbitrev(rev, callback) {
  nano.request({ db: 'alice',
                 doc: 'rabbit',
                 method: 'get',
                 params: { rev: rev }
               }, callback);
}

getrabbitrev('4-2e6cdc4c7e26b745c2881a24e0eeece2', function(err, body) {
  if (!err) {
    console.log(body);
  }
});
```

### Pipes

You can pipe in nano like in any other stream. For example if our `rabbit` document has an attachment with name `picture.png` you can pipe it to a `writable stream`:

``` js
var fs = require('fs'),
    nano = require('nano')('http://127.0.0.1:5984/');
var alice = nano.use('alice');
alice.attachment.get('rabbit', 'picture.png').pipe(fs.createWriteStream('/tmp/rabbit.png'));
```

then open `/tmp/rabbit.png` and you will see the rabbit picture.

## Tutorials, examples in the wild & screencasts

* article: [nano - a minimalistic CouchDB client for nodejs](http://writings.nunojob.com/2011/08/nano-minimalistic-couchdb-client-for-nodejs.html)
* article: [getting started with Node.js and CouchDB](http://writings.nunojob.com/2011/09/getting-started-with-nodejs-and-couchdb.html)
* article: [document update handler support](http://jackhq.tumblr.com/post/16035106690/nano-v1-2-x-document-update-handler-support-v1-2-x)
* article: [nano 3](http://writings.nunojob.com/2012/05/Nano-3.html)
* article: [securing a site with CouchDB cookie authentication using Node.js and nano](http://codetwizzle.com/articles/couchdb-cookie-authentication-nodejs-nano/)
* article: [adding copy to nano](http://blog.jlank.com/2012/07/04/adding-copy-to-nano/)
* article: [how to update a document with nano](http://writings.nunojob.com/2012/07/How-To-Update-A-Document-With-Nano-The-CouchDB-Client-for-Node.js.html)
* article: [thoughts on development using CouchDB with Node.js](http://tbranyen.com/post/thoughts-on-development-using-couchdb-with-nodejs)
* example in the wild: [nanoblog](https://github.com/grabbeh/nanoblog)

## Roadmap

Check [issues][2]

## Tests

To run (and configure) the test suite simply:

``` sh
cd nano
npm install
npm test
```

After adding a new test you can run it individually (with verbose output) using:

``` sh
nano_env=testing node tests/doc/list.js list_doc_params
```

where `list_doc_params` is the test name.

## Meta

* code: `git clone git://github.com/apache/couchdb-nano.git`
* home: <http://github.com/apache/couchdb-nano>
* bugs: <http://github.com/apache/couchdb-nano/issues>
* build: [![Build Status](https://travis-ci.org/apache/couchdb-nano.svg?branch=master)](https://travis-ci.org/apache/couchdb-nano)
* deps: [![dependencies Status](https://david-dm.org/apache/couchdb-nano/status.svg)](https://david-dm.org/apache/couchdb-nano)
* chat: [Freenode IRC @ #couchdb-dev][8]

[1]: http://npmjs.org
[2]: http://github.com/apache/couchdb-nano/issues
[4]: https://github.com/apache/couchdb-nano/blob/master/cfg/couch.example.js
[8]: http://webchat.freenode.net?channels=%23couchdb-dev
[follow]: https://github.com/jhs/follow
[request]:  https://github.com/request/request

## Release

To create a new release of nano. Run the following commands on the master branch

```sh
  npm version {patch|minor|major}
  github push  origin master --tags
  npm publish
```
