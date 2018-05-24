// Licensed under the Apache License, Version 2.0 (the 'License'); you may not
// use this file except in compliance with the License. You may obtain a copy of
// the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations under
// the License.

'use strict';

var helpers = require('../../helpers/integration');
var harness = helpers.harness(__filename);
var it = harness.it;

var nano = require('../../../lib/nano.js');
var fakeRequest = function(r, callback) {
  callback(null, { statusCode: 200 }, r);
};
// by passing in a fake Request object, we can intercept the request
// and see how Nano is pre-processing the parameters
var n = nano({url: 'http://localhost:5984', request: fakeRequest});
var db = n.db.use('fake');

it('should allow custom request object to be supplied', function(assert) {
  db.info(function(err, data) {
      assert.equal(err, null);
      assert.equal(data.method, 'GET');
      assert.equal(typeof data.headers, 'object');
      assert.end();
  });
});

it('should encode array counts parameter', function(assert) {
  db.search('fake', 'fake', { counts: ['brand','colour'] }, function(err, data) {
      assert.equal(err, null);
      assert.equal(data.method, 'GET');
      assert.equal(typeof data.headers, 'object');
      assert.equal(typeof data.qs, 'object');
      assert.equal(data.qs.counts, JSON.stringify(['brand','colour']));
      assert.end();
  });
});

it('should not encode string counts parameter', function(assert) {
  db.search('fake', 'fake', { counts: JSON.stringify(['brand','colour']) }, function(err, data) {
      assert.equal(err, null);
      assert.equal(data.method, 'GET');
      assert.equal(typeof data.headers, 'object');
      assert.equal(typeof data.qs, 'object');
      assert.equal(data.qs.counts, JSON.stringify(['brand','colour']));
      assert.end();
  });
});

it('should encode array drilldown parameter', function(assert) {
  db.search('fake', 'fake', { drilldown: ['colour','red'] }, function(err, data) {
      assert.equal(err, null);
      assert.equal(data.method, 'GET');
      assert.equal(typeof data.headers, 'object');
      assert.equal(typeof data.qs, 'object');
      assert.equal(data.qs.drilldown, JSON.stringify(['colour','red']));
      assert.end();
  });
});

it('should not encode string drilldown parameter', function(assert) {
  db.search('fake', 'fake', { drilldown: JSON.stringify(['colour','red']) }, function(err, data) {
      assert.equal(err, null);
      assert.equal(data.method, 'GET');
      assert.equal(typeof data.headers, 'object');
      assert.equal(typeof data.qs, 'object');
      assert.equal(data.qs.drilldown, JSON.stringify(['colour','red']));
      assert.end();
  });
});

it('should encode array group_sort parameter', function(assert) {
  db.search('fake', 'fake', { group_sort: ['-foo<number>','bar<string>'] }, function(err, data) {
      assert.equal(err, null);
      assert.equal(data.method, 'GET');
      assert.equal(typeof data.headers, 'object');
      assert.equal(typeof data.qs, 'object');
      assert.equal(data.qs.group_sort, JSON.stringify(['-foo<number>','bar<string>']));
      assert.end();
  });
});

it('should not encode string group_sort parameter', function(assert) {
  db.search('fake', 'fake', { group_sort: JSON.stringify(['-foo<number>','bar<string>']) }, function(err, data) {
      assert.equal(err, null);
      assert.equal(data.method, 'GET');
      assert.equal(typeof data.headers, 'object');
      assert.equal(typeof data.qs, 'object');
      assert.equal(data.qs.group_sort, JSON.stringify(['-foo<number>','bar<string>']));
      assert.end();
  });
});

it('should encode object ranges parameter', function(assert) {
  db.search('fake', 'fake', { ranges: {'price':'[0 TO 10]'} }, function(err, data) {
      assert.equal(err, null);
      assert.equal(data.method, 'GET');
      assert.equal(typeof data.headers, 'object');
      assert.equal(typeof data.qs, 'object');
      assert.equal(data.qs.ranges, JSON.stringify({'price':'[0 TO 10]'}));
      assert.end();
  });
});

it('should not encode string ranges parameter', function(assert) {
  db.search('fake', 'fake', { ranges: JSON.stringify({'price':'[0 TO 10]'}) }, function(err, data) {
      assert.equal(err, null);
      assert.equal(data.method, 'GET');
      assert.equal(typeof data.headers, 'object');
      assert.equal(typeof data.qs, 'object');
      assert.equal(data.qs.ranges, JSON.stringify({'price':'[0 TO 10]'}));
      assert.end();
  });
});

it('should encode array sort parameter', function(assert) {
  db.search('fake', 'fake', { sort: ['-foo<number>','bar<string>'] }, function(err, data) {
      assert.equal(err, null);
      assert.equal(data.method, 'GET');
      assert.equal(typeof data.headers, 'object');
      assert.equal(typeof data.qs, 'object');
      assert.equal(data.qs.sort, JSON.stringify(['-foo<number>','bar<string>']));
      assert.end();
  });
});

it('should not encode string sort parameter', function(assert) {
  db.search('fake', 'fake', { sort: JSON.stringify(['-foo<number>','bar<string>']) }, function(err, data) {
      assert.equal(err, null);
      assert.equal(data.method, 'GET');
      assert.equal(typeof data.headers, 'object');
      assert.equal(typeof data.qs, 'object');
      assert.equal(data.qs.sort, JSON.stringify(['-foo<number>','bar<string>']));
      assert.end();
  });
});

it('should encode unencoded sort parameter', function(assert) {
  db.search('fake', 'fake', { sort: '-foo<number>' }, function(err, data) {
      assert.equal(err, null);
      assert.equal(data.method, 'GET');
      assert.equal(typeof data.headers, 'object');
      assert.equal(typeof data.qs, 'object');
      assert.equal(data.qs.sort, JSON.stringify('-foo<number>'));
      assert.end();
  });
});

it('should not encode encoded string sort parameter', function(assert) {
  db.search('fake', 'fake', { sort: JSON.stringify('-foo<number>') }, function(err, data) {
      assert.equal(err, null);
      assert.equal(data.method, 'GET');
      assert.equal(typeof data.headers, 'object');
      assert.equal(typeof data.qs, 'object');
      assert.equal(data.qs.sort, JSON.stringify('-foo<number>'));
      assert.end();
  });
});


console.log('I AM HERE');