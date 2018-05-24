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
var db = harness.locals.db;
var nano = helpers.nano;
var it = harness.it;

it('should insert a one item', helpers.insertOne);

it('should generate three uuids', function(assert) {
  nano.uuids(3, function(error, data) {
    assert.equal(error, null, 'should generate uuids');
    assert.ok(data, 'got response');
    assert.ok(data.uuids, 'got uuids');
    assert.equal(data.uuids.count, 3, 'got 3');
    assert.end();
  });
});

it('should generate one uuid', function(assert) {
  nano.uuids(function(error, data) {
    assert.equal(error, null, 'should generate uuids');
    assert.ok(data, 'got response');
    assert.ok(data.uuids, 'got uuid');
    assert.equal(data.uuids.count, 1, 'got 1');
    assert.end();
  });
});
