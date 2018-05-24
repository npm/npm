'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _ExportMap = require('../ExportMap');

var _ExportMap2 = _interopRequireDefault(_ExportMap);

var _docsUrl = require('../docsUrl');

var _docsUrl2 = _interopRequireDefault(_docsUrl);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = {
  meta: {
    docs: {
      url: (0, _docsUrl2.default)('export')
    }
  },

  create: function (context) {
    const named = new Map();

    function addNamed(name, node) {
      let nodes = named.get(name);

      if (nodes == null) {
        nodes = new Set();
        named.set(name, nodes);
      }

      nodes.add(node);
    }

    return {
      'ExportDefaultDeclaration': node => addNamed('default', node),

      'ExportSpecifier': function (node) {
        addNamed(node.exported.name, node.exported);
      },

      'ExportNamedDeclaration': function (node) {
        if (node.declaration == null) return;

        if (node.declaration.id != null) {
          addNamed(node.declaration.id.name, node.declaration.id);
        }

        if (node.declaration.declarations != null) {
          for (let declaration of node.declaration.declarations) {
            (0, _ExportMap.recursivePatternCapture)(declaration.id, v => addNamed(v.name, v));
          }
        }
      },

      'ExportAllDeclaration': function (node) {
        if (node.source == null) return; // not sure if this is ever true

        const remoteExports = _ExportMap2.default.get(node.source.value, context);
        if (remoteExports == null) return;

        if (remoteExports.errors.length) {
          remoteExports.reportErrors(context, node);
          return;
        }
        let any = false;
        remoteExports.forEach((v, name) => name !== 'default' && (any = true) && // poor man's filter
        addNamed(name, node));

        if (!any) {
          context.report(node.source, `No named exports found in module '${node.source.value}'.`);
        }
      },

      'Program:exit': function () {
        for (let _ref of named) {
          var _ref2 = _slicedToArray(_ref, 2);

          let name = _ref2[0];
          let nodes = _ref2[1];

          if (nodes.size <= 1) continue;

          for (let node of nodes) {
            if (name === 'default') {
              context.report(node, 'Multiple default exports.');
            } else context.report(node, `Multiple exports of name '${name}'.`);
          }
        }
      }
    };
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzL2V4cG9ydC5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnRzIiwibWV0YSIsImRvY3MiLCJ1cmwiLCJjcmVhdGUiLCJjb250ZXh0IiwibmFtZWQiLCJNYXAiLCJhZGROYW1lZCIsIm5hbWUiLCJub2RlIiwibm9kZXMiLCJnZXQiLCJTZXQiLCJzZXQiLCJhZGQiLCJleHBvcnRlZCIsImRlY2xhcmF0aW9uIiwiaWQiLCJkZWNsYXJhdGlvbnMiLCJ2Iiwic291cmNlIiwicmVtb3RlRXhwb3J0cyIsInZhbHVlIiwiZXJyb3JzIiwibGVuZ3RoIiwicmVwb3J0RXJyb3JzIiwiYW55IiwiZm9yRWFjaCIsInJlcG9ydCIsInNpemUiXSwibWFwcGluZ3MiOiI7Ozs7QUFBQTs7OztBQUNBOzs7Ozs7QUFFQUEsT0FBT0MsT0FBUCxHQUFpQjtBQUNmQyxRQUFNO0FBQ0pDLFVBQU07QUFDSkMsV0FBSyx1QkFBUSxRQUFSO0FBREQ7QUFERixHQURTOztBQU9mQyxVQUFRLFVBQVVDLE9BQVYsRUFBbUI7QUFDekIsVUFBTUMsUUFBUSxJQUFJQyxHQUFKLEVBQWQ7O0FBRUEsYUFBU0MsUUFBVCxDQUFrQkMsSUFBbEIsRUFBd0JDLElBQXhCLEVBQThCO0FBQzVCLFVBQUlDLFFBQVFMLE1BQU1NLEdBQU4sQ0FBVUgsSUFBVixDQUFaOztBQUVBLFVBQUlFLFNBQVMsSUFBYixFQUFtQjtBQUNqQkEsZ0JBQVEsSUFBSUUsR0FBSixFQUFSO0FBQ0FQLGNBQU1RLEdBQU4sQ0FBVUwsSUFBVixFQUFnQkUsS0FBaEI7QUFDRDs7QUFFREEsWUFBTUksR0FBTixDQUFVTCxJQUFWO0FBQ0Q7O0FBRUQsV0FBTztBQUNMLGtDQUE2QkEsSUFBRCxJQUFVRixTQUFTLFNBQVQsRUFBb0JFLElBQXBCLENBRGpDOztBQUdMLHlCQUFtQixVQUFVQSxJQUFWLEVBQWdCO0FBQ2pDRixpQkFBU0UsS0FBS00sUUFBTCxDQUFjUCxJQUF2QixFQUE2QkMsS0FBS00sUUFBbEM7QUFDRCxPQUxJOztBQU9MLGdDQUEwQixVQUFVTixJQUFWLEVBQWdCO0FBQ3hDLFlBQUlBLEtBQUtPLFdBQUwsSUFBb0IsSUFBeEIsRUFBOEI7O0FBRTlCLFlBQUlQLEtBQUtPLFdBQUwsQ0FBaUJDLEVBQWpCLElBQXVCLElBQTNCLEVBQWlDO0FBQy9CVixtQkFBU0UsS0FBS08sV0FBTCxDQUFpQkMsRUFBakIsQ0FBb0JULElBQTdCLEVBQW1DQyxLQUFLTyxXQUFMLENBQWlCQyxFQUFwRDtBQUNEOztBQUVELFlBQUlSLEtBQUtPLFdBQUwsQ0FBaUJFLFlBQWpCLElBQWlDLElBQXJDLEVBQTJDO0FBQ3pDLGVBQUssSUFBSUYsV0FBVCxJQUF3QlAsS0FBS08sV0FBTCxDQUFpQkUsWUFBekMsRUFBdUQ7QUFDckQsb0RBQXdCRixZQUFZQyxFQUFwQyxFQUF3Q0UsS0FBS1osU0FBU1ksRUFBRVgsSUFBWCxFQUFpQlcsQ0FBakIsQ0FBN0M7QUFDRDtBQUNGO0FBQ0YsT0FuQkk7O0FBcUJMLDhCQUF3QixVQUFVVixJQUFWLEVBQWdCO0FBQ3RDLFlBQUlBLEtBQUtXLE1BQUwsSUFBZSxJQUFuQixFQUF5QixPQURhLENBQ047O0FBRWhDLGNBQU1DLGdCQUFnQixvQkFBVVYsR0FBVixDQUFjRixLQUFLVyxNQUFMLENBQVlFLEtBQTFCLEVBQWlDbEIsT0FBakMsQ0FBdEI7QUFDQSxZQUFJaUIsaUJBQWlCLElBQXJCLEVBQTJCOztBQUUzQixZQUFJQSxjQUFjRSxNQUFkLENBQXFCQyxNQUF6QixFQUFpQztBQUMvQkgsd0JBQWNJLFlBQWQsQ0FBMkJyQixPQUEzQixFQUFvQ0ssSUFBcEM7QUFDQTtBQUNEO0FBQ0QsWUFBSWlCLE1BQU0sS0FBVjtBQUNBTCxzQkFBY00sT0FBZCxDQUFzQixDQUFDUixDQUFELEVBQUlYLElBQUosS0FDcEJBLFNBQVMsU0FBVCxLQUNDa0IsTUFBTSxJQURQLEtBQ2dCO0FBQ2hCbkIsaUJBQVNDLElBQVQsRUFBZUMsSUFBZixDQUhGOztBQUtBLFlBQUksQ0FBQ2lCLEdBQUwsRUFBVTtBQUNSdEIsa0JBQVF3QixNQUFSLENBQWVuQixLQUFLVyxNQUFwQixFQUNHLHFDQUFvQ1gsS0FBS1csTUFBTCxDQUFZRSxLQUFNLElBRHpEO0FBRUQ7QUFDRixPQXpDSTs7QUEyQ0wsc0JBQWdCLFlBQVk7QUFDMUIseUJBQTBCakIsS0FBMUIsRUFBaUM7QUFBQTs7QUFBQSxjQUF2QkcsSUFBdUI7QUFBQSxjQUFqQkUsS0FBaUI7O0FBQy9CLGNBQUlBLE1BQU1tQixJQUFOLElBQWMsQ0FBbEIsRUFBcUI7O0FBRXJCLGVBQUssSUFBSXBCLElBQVQsSUFBaUJDLEtBQWpCLEVBQXdCO0FBQ3RCLGdCQUFJRixTQUFTLFNBQWIsRUFBd0I7QUFDdEJKLHNCQUFRd0IsTUFBUixDQUFlbkIsSUFBZixFQUFxQiwyQkFBckI7QUFDRCxhQUZELE1BRU9MLFFBQVF3QixNQUFSLENBQWVuQixJQUFmLEVBQXNCLDZCQUE0QkQsSUFBSyxJQUF2RDtBQUNSO0FBQ0Y7QUFDRjtBQXJESSxLQUFQO0FBdUREO0FBNUVjLENBQWpCIiwiZmlsZSI6InJ1bGVzL2V4cG9ydC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBFeHBvcnRNYXAsIHsgcmVjdXJzaXZlUGF0dGVybkNhcHR1cmUgfSBmcm9tICcuLi9FeHBvcnRNYXAnXG5pbXBvcnQgZG9jc1VybCBmcm9tICcuLi9kb2NzVXJsJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgbWV0YToge1xuICAgIGRvY3M6IHtcbiAgICAgIHVybDogZG9jc1VybCgnZXhwb3J0JyksXG4gICAgfSxcbiAgfSxcblxuICBjcmVhdGU6IGZ1bmN0aW9uIChjb250ZXh0KSB7XG4gICAgY29uc3QgbmFtZWQgPSBuZXcgTWFwKClcblxuICAgIGZ1bmN0aW9uIGFkZE5hbWVkKG5hbWUsIG5vZGUpIHtcbiAgICAgIGxldCBub2RlcyA9IG5hbWVkLmdldChuYW1lKVxuXG4gICAgICBpZiAobm9kZXMgPT0gbnVsbCkge1xuICAgICAgICBub2RlcyA9IG5ldyBTZXQoKVxuICAgICAgICBuYW1lZC5zZXQobmFtZSwgbm9kZXMpXG4gICAgICB9XG5cbiAgICAgIG5vZGVzLmFkZChub2RlKVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAnRXhwb3J0RGVmYXVsdERlY2xhcmF0aW9uJzogKG5vZGUpID0+IGFkZE5hbWVkKCdkZWZhdWx0Jywgbm9kZSksXG5cbiAgICAgICdFeHBvcnRTcGVjaWZpZXInOiBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICBhZGROYW1lZChub2RlLmV4cG9ydGVkLm5hbWUsIG5vZGUuZXhwb3J0ZWQpXG4gICAgICB9LFxuXG4gICAgICAnRXhwb3J0TmFtZWREZWNsYXJhdGlvbic6IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgIGlmIChub2RlLmRlY2xhcmF0aW9uID09IG51bGwpIHJldHVyblxuXG4gICAgICAgIGlmIChub2RlLmRlY2xhcmF0aW9uLmlkICE9IG51bGwpIHtcbiAgICAgICAgICBhZGROYW1lZChub2RlLmRlY2xhcmF0aW9uLmlkLm5hbWUsIG5vZGUuZGVjbGFyYXRpb24uaWQpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAobm9kZS5kZWNsYXJhdGlvbi5kZWNsYXJhdGlvbnMgIT0gbnVsbCkge1xuICAgICAgICAgIGZvciAobGV0IGRlY2xhcmF0aW9uIG9mIG5vZGUuZGVjbGFyYXRpb24uZGVjbGFyYXRpb25zKSB7XG4gICAgICAgICAgICByZWN1cnNpdmVQYXR0ZXJuQ2FwdHVyZShkZWNsYXJhdGlvbi5pZCwgdiA9PiBhZGROYW1lZCh2Lm5hbWUsIHYpKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgJ0V4cG9ydEFsbERlY2xhcmF0aW9uJzogZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgaWYgKG5vZGUuc291cmNlID09IG51bGwpIHJldHVybiAvLyBub3Qgc3VyZSBpZiB0aGlzIGlzIGV2ZXIgdHJ1ZVxuXG4gICAgICAgIGNvbnN0IHJlbW90ZUV4cG9ydHMgPSBFeHBvcnRNYXAuZ2V0KG5vZGUuc291cmNlLnZhbHVlLCBjb250ZXh0KVxuICAgICAgICBpZiAocmVtb3RlRXhwb3J0cyA9PSBudWxsKSByZXR1cm5cblxuICAgICAgICBpZiAocmVtb3RlRXhwb3J0cy5lcnJvcnMubGVuZ3RoKSB7XG4gICAgICAgICAgcmVtb3RlRXhwb3J0cy5yZXBvcnRFcnJvcnMoY29udGV4dCwgbm9kZSlcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBsZXQgYW55ID0gZmFsc2VcbiAgICAgICAgcmVtb3RlRXhwb3J0cy5mb3JFYWNoKCh2LCBuYW1lKSA9PlxuICAgICAgICAgIG5hbWUgIT09ICdkZWZhdWx0JyAmJlxuICAgICAgICAgIChhbnkgPSB0cnVlKSAmJiAvLyBwb29yIG1hbidzIGZpbHRlclxuICAgICAgICAgIGFkZE5hbWVkKG5hbWUsIG5vZGUpKVxuXG4gICAgICAgIGlmICghYW55KSB7XG4gICAgICAgICAgY29udGV4dC5yZXBvcnQobm9kZS5zb3VyY2UsXG4gICAgICAgICAgICBgTm8gbmFtZWQgZXhwb3J0cyBmb3VuZCBpbiBtb2R1bGUgJyR7bm9kZS5zb3VyY2UudmFsdWV9Jy5gKVxuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICAnUHJvZ3JhbTpleGl0JzogZnVuY3Rpb24gKCkge1xuICAgICAgICBmb3IgKGxldCBbbmFtZSwgbm9kZXNdIG9mIG5hbWVkKSB7XG4gICAgICAgICAgaWYgKG5vZGVzLnNpemUgPD0gMSkgY29udGludWVcblxuICAgICAgICAgIGZvciAobGV0IG5vZGUgb2Ygbm9kZXMpIHtcbiAgICAgICAgICAgIGlmIChuYW1lID09PSAnZGVmYXVsdCcpIHtcbiAgICAgICAgICAgICAgY29udGV4dC5yZXBvcnQobm9kZSwgJ011bHRpcGxlIGRlZmF1bHQgZXhwb3J0cy4nKVxuICAgICAgICAgICAgfSBlbHNlIGNvbnRleHQucmVwb3J0KG5vZGUsIGBNdWx0aXBsZSBleHBvcnRzIG9mIG5hbWUgJyR7bmFtZX0nLmApXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuICAgIH1cbiAgfSxcbn1cbiJdfQ==