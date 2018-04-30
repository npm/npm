"use strict";

module.exports = function bfsTraverseCreator(_ref) {
  var t = _ref.types,
      traverse = _ref.traverse;

  function getFields(path) {
    return t.VISITOR_KEYS[path.type];
  }

  return function bfsTraverse(path, _visitor) {
    if (!path.node) {
      throw new Error("Not a valid path");
    }

    var visitor = traverse.explode(_visitor);
    var queue = [path];
    var current;

    while (queue.length > 0) {
      current = queue.shift(); // call

      if (visitor && visitor[current.type] && Array.isArray(visitor[current.type].enter)) {
        var fns = visitor[current.type].enter;
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = fns[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var _fn = _step.value;
            if (typeof _fn === "function") _fn(current);
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return != null) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      }

      var fields = getFields(current);
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = fields[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var _field = _step2.value;
          var child = current.get(_field);

          if (Array.isArray(child)) {
            // visit container left to right
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
              for (var _iterator3 = child[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                var _c = _step3.value;
                if (_c.node) queue.push(_c);
              }
            } catch (err) {
              _didIteratorError3 = true;
              _iteratorError3 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion3 && _iterator3.return != null) {
                  _iterator3.return();
                }
              } finally {
                if (_didIteratorError3) {
                  throw _iteratorError3;
                }
              }
            }
          } else {
            if (child.node) queue.push(child);
          }
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }
    }
  };
};