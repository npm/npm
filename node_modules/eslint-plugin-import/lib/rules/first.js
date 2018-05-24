'use strict';

var _docsUrl = require('../docsUrl');

var _docsUrl2 = _interopRequireDefault(_docsUrl);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = {
  meta: {
    docs: {
      url: (0, _docsUrl2.default)('first')
    }
  },

  create: function (context) {
    function isPossibleDirective(node) {
      return node.type === 'ExpressionStatement' && node.expression.type === 'Literal' && typeof node.expression.value === 'string';
    }

    return {
      'Program': function (n) {
        const body = n.body,
              absoluteFirst = context.options[0] === 'absolute-first';
        let nonImportCount = 0,
            anyExpressions = false,
            anyRelative = false;
        body.forEach(function (node) {
          if (!anyExpressions && isPossibleDirective(node)) {
            return;
          }

          anyExpressions = true;

          if (node.type === 'ImportDeclaration') {
            if (absoluteFirst) {
              if (/^\./.test(node.source.value)) {
                anyRelative = true;
              } else if (anyRelative) {
                context.report({
                  node: node.source,
                  message: 'Absolute imports should come before relative imports.'
                });
              }
            }
            if (nonImportCount > 0) {
              context.report({
                node,
                message: 'Import in body of module; reorder to top.'
              });
            }
          } else {
            nonImportCount++;
          }
        });
      }
    };
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzL2ZpcnN0LmpzIl0sIm5hbWVzIjpbIm1vZHVsZSIsImV4cG9ydHMiLCJtZXRhIiwiZG9jcyIsInVybCIsImNyZWF0ZSIsImNvbnRleHQiLCJpc1Bvc3NpYmxlRGlyZWN0aXZlIiwibm9kZSIsInR5cGUiLCJleHByZXNzaW9uIiwidmFsdWUiLCJuIiwiYm9keSIsImFic29sdXRlRmlyc3QiLCJvcHRpb25zIiwibm9uSW1wb3J0Q291bnQiLCJhbnlFeHByZXNzaW9ucyIsImFueVJlbGF0aXZlIiwiZm9yRWFjaCIsInRlc3QiLCJzb3VyY2UiLCJyZXBvcnQiLCJtZXNzYWdlIl0sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7QUFFQUEsT0FBT0MsT0FBUCxHQUFpQjtBQUNmQyxRQUFNO0FBQ0pDLFVBQU07QUFDSkMsV0FBSyx1QkFBUSxPQUFSO0FBREQ7QUFERixHQURTOztBQU9mQyxVQUFRLFVBQVVDLE9BQVYsRUFBbUI7QUFDekIsYUFBU0MsbUJBQVQsQ0FBOEJDLElBQTlCLEVBQW9DO0FBQ2xDLGFBQU9BLEtBQUtDLElBQUwsS0FBYyxxQkFBZCxJQUNMRCxLQUFLRSxVQUFMLENBQWdCRCxJQUFoQixLQUF5QixTQURwQixJQUVMLE9BQU9ELEtBQUtFLFVBQUwsQ0FBZ0JDLEtBQXZCLEtBQWlDLFFBRm5DO0FBR0Q7O0FBRUQsV0FBTztBQUNMLGlCQUFXLFVBQVVDLENBQVYsRUFBYTtBQUN0QixjQUFNQyxPQUFPRCxFQUFFQyxJQUFmO0FBQUEsY0FDTUMsZ0JBQWdCUixRQUFRUyxPQUFSLENBQWdCLENBQWhCLE1BQXVCLGdCQUQ3QztBQUVBLFlBQUlDLGlCQUFpQixDQUFyQjtBQUFBLFlBQ0lDLGlCQUFpQixLQURyQjtBQUFBLFlBRUlDLGNBQWMsS0FGbEI7QUFHQUwsYUFBS00sT0FBTCxDQUFhLFVBQVVYLElBQVYsRUFBZTtBQUMxQixjQUFJLENBQUNTLGNBQUQsSUFBbUJWLG9CQUFvQkMsSUFBcEIsQ0FBdkIsRUFBa0Q7QUFDaEQ7QUFDRDs7QUFFRFMsMkJBQWlCLElBQWpCOztBQUVBLGNBQUlULEtBQUtDLElBQUwsS0FBYyxtQkFBbEIsRUFBdUM7QUFDckMsZ0JBQUlLLGFBQUosRUFBbUI7QUFDakIsa0JBQUksTUFBTU0sSUFBTixDQUFXWixLQUFLYSxNQUFMLENBQVlWLEtBQXZCLENBQUosRUFBbUM7QUFDakNPLDhCQUFjLElBQWQ7QUFDRCxlQUZELE1BRU8sSUFBSUEsV0FBSixFQUFpQjtBQUN0Qlosd0JBQVFnQixNQUFSLENBQWU7QUFDYmQsd0JBQU1BLEtBQUthLE1BREU7QUFFYkUsMkJBQVM7QUFGSSxpQkFBZjtBQUlEO0FBQ0Y7QUFDRCxnQkFBSVAsaUJBQWlCLENBQXJCLEVBQXdCO0FBQ3RCVixzQkFBUWdCLE1BQVIsQ0FBZTtBQUNiZCxvQkFEYTtBQUViZSx5QkFBUztBQUZJLGVBQWY7QUFJRDtBQUNGLFdBakJELE1BaUJPO0FBQ0xQO0FBQ0Q7QUFDRixTQTNCRDtBQTRCRDtBQW5DSSxLQUFQO0FBcUNEO0FBbkRjLENBQWpCIiwiZmlsZSI6InJ1bGVzL2ZpcnN0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGRvY3NVcmwgZnJvbSAnLi4vZG9jc1VybCdcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIG1ldGE6IHtcbiAgICBkb2NzOiB7XG4gICAgICB1cmw6IGRvY3NVcmwoJ2ZpcnN0JyksXG4gICAgfSxcbiAgfSxcblxuICBjcmVhdGU6IGZ1bmN0aW9uIChjb250ZXh0KSB7XG4gICAgZnVuY3Rpb24gaXNQb3NzaWJsZURpcmVjdGl2ZSAobm9kZSkge1xuICAgICAgcmV0dXJuIG5vZGUudHlwZSA9PT0gJ0V4cHJlc3Npb25TdGF0ZW1lbnQnICYmXG4gICAgICAgIG5vZGUuZXhwcmVzc2lvbi50eXBlID09PSAnTGl0ZXJhbCcgJiZcbiAgICAgICAgdHlwZW9mIG5vZGUuZXhwcmVzc2lvbi52YWx1ZSA9PT0gJ3N0cmluZydcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgJ1Byb2dyYW0nOiBmdW5jdGlvbiAobikge1xuICAgICAgICBjb25zdCBib2R5ID0gbi5ib2R5XG4gICAgICAgICAgICAsIGFic29sdXRlRmlyc3QgPSBjb250ZXh0Lm9wdGlvbnNbMF0gPT09ICdhYnNvbHV0ZS1maXJzdCdcbiAgICAgICAgbGV0IG5vbkltcG9ydENvdW50ID0gMFxuICAgICAgICAgICwgYW55RXhwcmVzc2lvbnMgPSBmYWxzZVxuICAgICAgICAgICwgYW55UmVsYXRpdmUgPSBmYWxzZVxuICAgICAgICBib2R5LmZvckVhY2goZnVuY3Rpb24gKG5vZGUpe1xuICAgICAgICAgIGlmICghYW55RXhwcmVzc2lvbnMgJiYgaXNQb3NzaWJsZURpcmVjdGl2ZShub2RlKSkge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgYW55RXhwcmVzc2lvbnMgPSB0cnVlXG5cbiAgICAgICAgICBpZiAobm9kZS50eXBlID09PSAnSW1wb3J0RGVjbGFyYXRpb24nKSB7XG4gICAgICAgICAgICBpZiAoYWJzb2x1dGVGaXJzdCkge1xuICAgICAgICAgICAgICBpZiAoL15cXC4vLnRlc3Qobm9kZS5zb3VyY2UudmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgYW55UmVsYXRpdmUgPSB0cnVlXG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAoYW55UmVsYXRpdmUpIHtcbiAgICAgICAgICAgICAgICBjb250ZXh0LnJlcG9ydCh7XG4gICAgICAgICAgICAgICAgICBub2RlOiBub2RlLnNvdXJjZSxcbiAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdBYnNvbHV0ZSBpbXBvcnRzIHNob3VsZCBjb21lIGJlZm9yZSByZWxhdGl2ZSBpbXBvcnRzLicsXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG5vbkltcG9ydENvdW50ID4gMCkge1xuICAgICAgICAgICAgICBjb250ZXh0LnJlcG9ydCh7XG4gICAgICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnSW1wb3J0IGluIGJvZHkgb2YgbW9kdWxlOyByZW9yZGVyIHRvIHRvcC4nLFxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBub25JbXBvcnRDb3VudCsrXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfSxcbiAgICB9XG4gIH0sXG59XG4iXX0=