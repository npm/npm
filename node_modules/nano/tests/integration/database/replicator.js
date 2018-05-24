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

var async = require('async');
var helpers = require('../../helpers/integration');
var harness = helpers.harness(__filename);
var it = harness.it;
var db = harness.locals.db;
var nano = harness.locals.nano;

var replica;
var replica2;
var replica3;

it('should insert a bunch of items', helpers.insertThree);

it('creates a bunch of database replicas', function(assert) {
    async.forEach(['database_replica', 'database_replica2', 'database_replica3'],
    nano.db.create, function(error) {
        assert.equal(error, null, 'created database(s)');
        assert.end();
    });
});

it('should be able to replicate (replicator) three docs', function(assert) {
  replica = nano.use('database_replica');
  db.replication.enable('database_replica', function(error, data) {
    assert.equal(error, null, 'replication should not fail');
    assert.true(data, 'replication should be scheduled');
    assert.true(data.ok, 'replication should be scheduled');
    assert.true(data.id, 'replication should return the id to query back');
    function waitForReplication() {
      setTimeout(function() {
        db.replication.query(data.id, function(error, reply) {
          assert.equal(reply.target, 'database_replica', 'target db should match');
          assert.equal(reply._replication_state, 'triggered', 'replication should have triggered');
          replica.list(function(error, list) {
            assert.equal(error, null, 'should be able to invoke list');
            assert.equal(list['total_rows'], 3, 'and have three documents');
            db.replication.disable(reply._id, reply._rev, function(error, disabled) {
              assert.true(disabled, 'should not be null');
              assert.true(disabled.ok, 'should have stopped the replication');
              assert.end();
            });
          })
        })
      },
      3000)
    };
    waitForReplication();
  });
});

it('should be able to replicate (replicator) to a `nano` object', function(assert) {
  replica2 = nano.use('database_replica2');
  nano.db.replication.enable(db, 'database_replica2', function(error, data) {
    assert.equal(error, null, 'replication should not fail');
    assert.true(data, 'replication should be scheduled');
    assert.true(data.ok, 'replication should be scheduled');
    assert.true(data.id, 'replication should return the id to query back');
    function waitForReplication() {
      setTimeout(function() {
        nano.db.replication.query(data.id, function(error, reply) {
          assert.equal(reply.target, 'database_replica2', 'target db should match');
          assert.equal(reply._replication_state, 'triggered', 'replication should have triggered');
          replica2.list(function(error, list) {
            assert.equal(error, null, 'should be able to invoke list');
            assert.equal(list['total_rows'], 3, 'and have three documents');
            nano.db.replication.disable(reply._id, reply._rev, function(error, disabled) {
              assert.true(disabled, 'should not be null');
              assert.true(disabled.ok, 'should have stopped the replication');
              assert.end();
            });
          });
        })
      },
      3000)
    };
    waitForReplication();
  });
});

it('should be able to replicate (replicator) with params', function(assert) {
  replica3 = nano.use('database_replica3');
  db.replication.enable('database_replica3', {}, function(error, data) {
    assert.equal(error, null, 'replication should not fail');
    assert.true(data, 'replication should be scheduled');
    assert.true(data.ok, 'replication should be scheduled');
    assert.true(data.id, 'replication should return the id to query back');
    function waitForReplication() {
      setTimeout(function() {
        db.replication.query(data.id, function(error, reply) {
          assert.equal(reply.target, 'database_replica3', 'target db should match');
          assert.equal(reply._replication_state, 'triggered', 'replication should have triggered');
          replica3.list(function(error, list) {
            assert.equal(error, null, 'should be able to invoke list');
            assert.equal(list['total_rows'], 3, 'and have three documents');
            db.replication.disable(reply._id, reply._rev, function(error, disabled) {
              assert.true(disabled, 'should not be null');
              assert.true(disabled.ok, 'should have stopped the replication');
              assert.end();
            });
          });
        })
      },
      3000)
    };
    waitForReplication();
  });
});

it('should destroy the extra databases', function(assert) {
 async.forEach(['database_replica', 'database_replica2', 'database_replica3'],
 nano.db.destroy, function(error) {
   assert.equal(error, null, 'deleted databases');
   assert.end();
 });
});
