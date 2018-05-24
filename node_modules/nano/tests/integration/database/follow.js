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
var db = harness.locals.db;

if (helpers.unmocked) {
  it('should insert a bunch of items', helpers.insertThree);

  var feed1;

  it('should be able to get the changes feed', function(assert) {
    var i = 3;

    feed1 = db.follow({since: '0'});

    feed1.on('change', function(change) {
      assert.ok(change, 'change existed');
      //assert.equal(change.seq, i + 1, 'seq is set correctly');
      ++i;
      if (i === 4) {
        assert.end();
      }
    });

    feed1.follow();

    setTimeout(function() {
      db.insert({'bar': 'baz'}, 'barbaz');
    }, 100);
  });

  it('should clear changes feed', function(assert) {
    feed1.die();
    assert.end();
  });
}
