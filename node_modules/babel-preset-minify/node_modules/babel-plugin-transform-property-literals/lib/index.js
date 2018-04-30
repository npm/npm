"use strict";

var _require = require("./property-name"),
    reduceStaticPropertyNameES5 = _require.reduceStaticPropertyNameES5;

module.exports = function (_ref) {
  var t = _ref.types;
  return {
    name: "transform-property-literals",
    visitor: {
      // { 'foo': 'bar' } -> { foo: 'bar' }
      ObjectProperty: {
        exit(path) {
          var key = path.get("key");

          if (!key.isStringLiteral()) {
            return;
          }

          var newNode = t.clone(path.node);
          newNode.key = reduceStaticPropertyNameES5(t, key.node);
          newNode.computed = false;
          path.replaceWith(newNode);
        }

      }
    }
  };
};