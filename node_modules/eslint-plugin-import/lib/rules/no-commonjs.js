'use strict';

var _docsUrl = require('../docsUrl');

var _docsUrl2 = _interopRequireDefault(_docsUrl);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const EXPORT_MESSAGE = 'Expected "export" or "export default"',
      IMPORT_MESSAGE = 'Expected "import" instead of "require()"'; /**
                                                                    * @fileoverview Rule to prefer ES6 to CJS
                                                                    * @author Jamund Ferguson
                                                                    */

function allowPrimitive(node, context) {
  if (context.options.indexOf('allow-primitive-modules') < 0) return false;
  if (node.parent.type !== 'AssignmentExpression') return false;
  return node.parent.right.type !== 'ObjectExpression';
}

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------


module.exports = {
  meta: {
    docs: {
      url: (0, _docsUrl2.default)('no-commonjs')
    }
  },

  create: function (context) {

    return {

      'MemberExpression': function (node) {

        // module.exports
        if (node.object.name === 'module' && node.property.name === 'exports') {
          if (allowPrimitive(node, context)) return;
          context.report({ node, message: EXPORT_MESSAGE });
        }

        // exports.
        if (node.object.name === 'exports') {
          const isInScope = context.getScope().variables.some(variable => variable.name === 'exports');
          if (!isInScope) {
            context.report({ node, message: EXPORT_MESSAGE });
          }
        }
      },
      'CallExpression': function (call) {
        if (context.getScope().type !== 'module') return;
        if (call.parent.type !== 'ExpressionStatement' && call.parent.type !== 'VariableDeclarator') return;

        if (call.callee.type !== 'Identifier') return;
        if (call.callee.name !== 'require') return;

        if (call.arguments.length !== 1) return;
        var module = call.arguments[0];

        if (module.type !== 'Literal') return;
        if (typeof module.value !== 'string') return;

        // keeping it simple: all 1-string-arg `require` calls are reported
        context.report({
          node: call.callee,
          message: IMPORT_MESSAGE
        });
      }
    };
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzL25vLWNvbW1vbmpzLmpzIl0sIm5hbWVzIjpbIkVYUE9SVF9NRVNTQUdFIiwiSU1QT1JUX01FU1NBR0UiLCJhbGxvd1ByaW1pdGl2ZSIsIm5vZGUiLCJjb250ZXh0Iiwib3B0aW9ucyIsImluZGV4T2YiLCJwYXJlbnQiLCJ0eXBlIiwicmlnaHQiLCJtb2R1bGUiLCJleHBvcnRzIiwibWV0YSIsImRvY3MiLCJ1cmwiLCJjcmVhdGUiLCJvYmplY3QiLCJuYW1lIiwicHJvcGVydHkiLCJyZXBvcnQiLCJtZXNzYWdlIiwiaXNJblNjb3BlIiwiZ2V0U2NvcGUiLCJ2YXJpYWJsZXMiLCJzb21lIiwidmFyaWFibGUiLCJjYWxsIiwiY2FsbGVlIiwiYXJndW1lbnRzIiwibGVuZ3RoIiwidmFsdWUiXSwibWFwcGluZ3MiOiI7O0FBS0E7Ozs7OztBQUVBLE1BQU1BLGlCQUFpQix1Q0FBdkI7QUFBQSxNQUNNQyxpQkFBaUIsMENBRHZCLEMsQ0FQQTs7Ozs7QUFVQSxTQUFTQyxjQUFULENBQXdCQyxJQUF4QixFQUE4QkMsT0FBOUIsRUFBdUM7QUFDckMsTUFBSUEsUUFBUUMsT0FBUixDQUFnQkMsT0FBaEIsQ0FBd0IseUJBQXhCLElBQXFELENBQXpELEVBQTRELE9BQU8sS0FBUDtBQUM1RCxNQUFJSCxLQUFLSSxNQUFMLENBQVlDLElBQVosS0FBcUIsc0JBQXpCLEVBQWlELE9BQU8sS0FBUDtBQUNqRCxTQUFRTCxLQUFLSSxNQUFMLENBQVlFLEtBQVosQ0FBa0JELElBQWxCLEtBQTJCLGtCQUFuQztBQUNEOztBQUVEO0FBQ0E7QUFDQTs7O0FBR0FFLE9BQU9DLE9BQVAsR0FBaUI7QUFDZkMsUUFBTTtBQUNKQyxVQUFNO0FBQ0pDLFdBQUssdUJBQVEsYUFBUjtBQUREO0FBREYsR0FEUzs7QUFPZkMsVUFBUSxVQUFVWCxPQUFWLEVBQW1COztBQUV6QixXQUFPOztBQUVMLDBCQUFvQixVQUFVRCxJQUFWLEVBQWdCOztBQUVsQztBQUNBLFlBQUlBLEtBQUthLE1BQUwsQ0FBWUMsSUFBWixLQUFxQixRQUFyQixJQUFpQ2QsS0FBS2UsUUFBTCxDQUFjRCxJQUFkLEtBQXVCLFNBQTVELEVBQXVFO0FBQ3JFLGNBQUlmLGVBQWVDLElBQWYsRUFBcUJDLE9BQXJCLENBQUosRUFBbUM7QUFDbkNBLGtCQUFRZSxNQUFSLENBQWUsRUFBRWhCLElBQUYsRUFBUWlCLFNBQVNwQixjQUFqQixFQUFmO0FBQ0Q7O0FBRUQ7QUFDQSxZQUFJRyxLQUFLYSxNQUFMLENBQVlDLElBQVosS0FBcUIsU0FBekIsRUFBb0M7QUFDbEMsZ0JBQU1JLFlBQVlqQixRQUFRa0IsUUFBUixHQUNmQyxTQURlLENBRWZDLElBRmUsQ0FFVkMsWUFBWUEsU0FBU1IsSUFBVCxLQUFrQixTQUZwQixDQUFsQjtBQUdBLGNBQUksQ0FBRUksU0FBTixFQUFpQjtBQUNmakIsb0JBQVFlLE1BQVIsQ0FBZSxFQUFFaEIsSUFBRixFQUFRaUIsU0FBU3BCLGNBQWpCLEVBQWY7QUFDRDtBQUNGO0FBRUYsT0FwQkk7QUFxQkwsd0JBQWtCLFVBQVUwQixJQUFWLEVBQWdCO0FBQ2hDLFlBQUl0QixRQUFRa0IsUUFBUixHQUFtQmQsSUFBbkIsS0FBNEIsUUFBaEMsRUFBMEM7QUFDMUMsWUFDRWtCLEtBQUtuQixNQUFMLENBQVlDLElBQVosS0FBcUIscUJBQXJCLElBQ0drQixLQUFLbkIsTUFBTCxDQUFZQyxJQUFaLEtBQXFCLG9CQUYxQixFQUdFOztBQUVGLFlBQUlrQixLQUFLQyxNQUFMLENBQVluQixJQUFaLEtBQXFCLFlBQXpCLEVBQXVDO0FBQ3ZDLFlBQUlrQixLQUFLQyxNQUFMLENBQVlWLElBQVosS0FBcUIsU0FBekIsRUFBb0M7O0FBRXBDLFlBQUlTLEtBQUtFLFNBQUwsQ0FBZUMsTUFBZixLQUEwQixDQUE5QixFQUFpQztBQUNqQyxZQUFJbkIsU0FBU2dCLEtBQUtFLFNBQUwsQ0FBZSxDQUFmLENBQWI7O0FBRUEsWUFBSWxCLE9BQU9GLElBQVAsS0FBZ0IsU0FBcEIsRUFBK0I7QUFDL0IsWUFBSSxPQUFPRSxPQUFPb0IsS0FBZCxLQUF3QixRQUE1QixFQUFzQzs7QUFFdEM7QUFDQTFCLGdCQUFRZSxNQUFSLENBQWU7QUFDYmhCLGdCQUFNdUIsS0FBS0MsTUFERTtBQUViUCxtQkFBU25CO0FBRkksU0FBZjtBQUlEO0FBMUNJLEtBQVA7QUE2Q0Q7QUF0RGMsQ0FBakIiLCJmaWxlIjoicnVsZXMvbm8tY29tbW9uanMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBmaWxlb3ZlcnZpZXcgUnVsZSB0byBwcmVmZXIgRVM2IHRvIENKU1xuICogQGF1dGhvciBKYW11bmQgRmVyZ3Vzb25cbiAqL1xuXG5pbXBvcnQgZG9jc1VybCBmcm9tICcuLi9kb2NzVXJsJ1xuXG5jb25zdCBFWFBPUlRfTUVTU0FHRSA9ICdFeHBlY3RlZCBcImV4cG9ydFwiIG9yIFwiZXhwb3J0IGRlZmF1bHRcIidcbiAgICAsIElNUE9SVF9NRVNTQUdFID0gJ0V4cGVjdGVkIFwiaW1wb3J0XCIgaW5zdGVhZCBvZiBcInJlcXVpcmUoKVwiJ1xuXG5mdW5jdGlvbiBhbGxvd1ByaW1pdGl2ZShub2RlLCBjb250ZXh0KSB7XG4gIGlmIChjb250ZXh0Lm9wdGlvbnMuaW5kZXhPZignYWxsb3ctcHJpbWl0aXZlLW1vZHVsZXMnKSA8IDApIHJldHVybiBmYWxzZVxuICBpZiAobm9kZS5wYXJlbnQudHlwZSAhPT0gJ0Fzc2lnbm1lbnRFeHByZXNzaW9uJykgcmV0dXJuIGZhbHNlXG4gIHJldHVybiAobm9kZS5wYXJlbnQucmlnaHQudHlwZSAhPT0gJ09iamVjdEV4cHJlc3Npb24nKVxufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gUnVsZSBEZWZpbml0aW9uXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBtZXRhOiB7XG4gICAgZG9jczoge1xuICAgICAgdXJsOiBkb2NzVXJsKCduby1jb21tb25qcycpLFxuICAgIH0sXG4gIH0sXG5cbiAgY3JlYXRlOiBmdW5jdGlvbiAoY29udGV4dCkge1xuXG4gICAgcmV0dXJuIHtcblxuICAgICAgJ01lbWJlckV4cHJlc3Npb24nOiBmdW5jdGlvbiAobm9kZSkge1xuXG4gICAgICAgIC8vIG1vZHVsZS5leHBvcnRzXG4gICAgICAgIGlmIChub2RlLm9iamVjdC5uYW1lID09PSAnbW9kdWxlJyAmJiBub2RlLnByb3BlcnR5Lm5hbWUgPT09ICdleHBvcnRzJykge1xuICAgICAgICAgIGlmIChhbGxvd1ByaW1pdGl2ZShub2RlLCBjb250ZXh0KSkgcmV0dXJuXG4gICAgICAgICAgY29udGV4dC5yZXBvcnQoeyBub2RlLCBtZXNzYWdlOiBFWFBPUlRfTUVTU0FHRSB9KVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gZXhwb3J0cy5cbiAgICAgICAgaWYgKG5vZGUub2JqZWN0Lm5hbWUgPT09ICdleHBvcnRzJykge1xuICAgICAgICAgIGNvbnN0IGlzSW5TY29wZSA9IGNvbnRleHQuZ2V0U2NvcGUoKVxuICAgICAgICAgICAgLnZhcmlhYmxlc1xuICAgICAgICAgICAgLnNvbWUodmFyaWFibGUgPT4gdmFyaWFibGUubmFtZSA9PT0gJ2V4cG9ydHMnKVxuICAgICAgICAgIGlmICghIGlzSW5TY29wZSkge1xuICAgICAgICAgICAgY29udGV4dC5yZXBvcnQoeyBub2RlLCBtZXNzYWdlOiBFWFBPUlRfTUVTU0FHRSB9KVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICB9LFxuICAgICAgJ0NhbGxFeHByZXNzaW9uJzogZnVuY3Rpb24gKGNhbGwpIHtcbiAgICAgICAgaWYgKGNvbnRleHQuZ2V0U2NvcGUoKS50eXBlICE9PSAnbW9kdWxlJykgcmV0dXJuXG4gICAgICAgIGlmIChcbiAgICAgICAgICBjYWxsLnBhcmVudC50eXBlICE9PSAnRXhwcmVzc2lvblN0YXRlbWVudCdcbiAgICAgICAgICAmJiBjYWxsLnBhcmVudC50eXBlICE9PSAnVmFyaWFibGVEZWNsYXJhdG9yJ1xuICAgICAgICApIHJldHVyblxuXG4gICAgICAgIGlmIChjYWxsLmNhbGxlZS50eXBlICE9PSAnSWRlbnRpZmllcicpIHJldHVyblxuICAgICAgICBpZiAoY2FsbC5jYWxsZWUubmFtZSAhPT0gJ3JlcXVpcmUnKSByZXR1cm5cblxuICAgICAgICBpZiAoY2FsbC5hcmd1bWVudHMubGVuZ3RoICE9PSAxKSByZXR1cm5cbiAgICAgICAgdmFyIG1vZHVsZSA9IGNhbGwuYXJndW1lbnRzWzBdXG5cbiAgICAgICAgaWYgKG1vZHVsZS50eXBlICE9PSAnTGl0ZXJhbCcpIHJldHVyblxuICAgICAgICBpZiAodHlwZW9mIG1vZHVsZS52YWx1ZSAhPT0gJ3N0cmluZycpIHJldHVyblxuXG4gICAgICAgIC8vIGtlZXBpbmcgaXQgc2ltcGxlOiBhbGwgMS1zdHJpbmctYXJnIGByZXF1aXJlYCBjYWxscyBhcmUgcmVwb3J0ZWRcbiAgICAgICAgY29udGV4dC5yZXBvcnQoe1xuICAgICAgICAgIG5vZGU6IGNhbGwuY2FsbGVlLFxuICAgICAgICAgIG1lc3NhZ2U6IElNUE9SVF9NRVNTQUdFLFxuICAgICAgICB9KVxuICAgICAgfSxcbiAgICB9XG5cbiAgfSxcbn1cbiJdfQ==