'use strict';

var ES = require('../').ES2017;

var ops = require('../operations/2017');

// jscs:disable
var expectedMissing = ['CreateMethodProperty', 'DefinePropertyOrThrow', 'DeletePropertyOrThrow', 'Construct', 'SetIntegrityLevel', 'TestIntegrityLevel', 'CreateArrayFromList', 'CreateListFromArrayLike', 'OrdinaryHasInstance', 'EnumerableOwnProperties', 'CreateListIterator', 'thisNumberValue', 'thisTimeValue', 'thisStringValue', 'RegExpBuiltinExec', 'IsPromise'];
// jscs:enable

require('./tests').es2017(ES, ops, expectedMissing);
