'use strict';

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _minimatch = require('minimatch');

var _minimatch2 = _interopRequireDefault(_minimatch);

var _staticRequire = require('../core/staticRequire');

var _staticRequire2 = _interopRequireDefault(_staticRequire);

var _docsUrl = require('../docsUrl');

var _docsUrl2 = _interopRequireDefault(_docsUrl);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function report(context, node) {
  context.report({
    node,
    message: 'Imported module should be assigned'
  });
}

function testIsAllow(globs, filename, source) {
  if (!Array.isArray(globs)) {
    return false; // default doesn't allow any patterns
  }

  let filePath;

  if (source[0] !== '.' && source[0] !== '/') {
    // a node module
    filePath = source;
  } else {
    filePath = _path2.default.resolve(_path2.default.dirname(filename), source); // get source absolute path
  }

  return globs.find(glob => (0, _minimatch2.default)(filePath, glob) || (0, _minimatch2.default)(filePath, _path2.default.join(process.cwd(), glob))) !== undefined;
}

function create(context) {
  const options = context.options[0] || {};
  const filename = context.getFilename();
  const isAllow = source => testIsAllow(options.allow, filename, source);

  return {
    ImportDeclaration(node) {
      if (node.specifiers.length === 0 && !isAllow(node.source.value)) {
        report(context, node);
      }
    },
    ExpressionStatement(node) {
      if (node.expression.type === 'CallExpression' && (0, _staticRequire2.default)(node.expression) && !isAllow(node.expression.arguments[0].value)) {
        report(context, node.expression);
      }
    }
  };
}

module.exports = {
  create,
  meta: {
    docs: {
      url: (0, _docsUrl2.default)('no-unassigned-import')
    },
    schema: [{
      'type': 'object',
      'properties': {
        'devDependencies': { 'type': ['boolean', 'array'] },
        'optionalDependencies': { 'type': ['boolean', 'array'] },
        'peerDependencies': { 'type': ['boolean', 'array'] },
        'allow': {
          'type': 'array',
          'items': {
            'type': 'string'
          }
        }
      },
      'additionalProperties': false
    }]
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzL25vLXVuYXNzaWduZWQtaW1wb3J0LmpzIl0sIm5hbWVzIjpbInJlcG9ydCIsImNvbnRleHQiLCJub2RlIiwibWVzc2FnZSIsInRlc3RJc0FsbG93IiwiZ2xvYnMiLCJmaWxlbmFtZSIsInNvdXJjZSIsIkFycmF5IiwiaXNBcnJheSIsImZpbGVQYXRoIiwicmVzb2x2ZSIsImRpcm5hbWUiLCJmaW5kIiwiZ2xvYiIsImpvaW4iLCJwcm9jZXNzIiwiY3dkIiwidW5kZWZpbmVkIiwiY3JlYXRlIiwib3B0aW9ucyIsImdldEZpbGVuYW1lIiwiaXNBbGxvdyIsImFsbG93IiwiSW1wb3J0RGVjbGFyYXRpb24iLCJzcGVjaWZpZXJzIiwibGVuZ3RoIiwidmFsdWUiLCJFeHByZXNzaW9uU3RhdGVtZW50IiwiZXhwcmVzc2lvbiIsInR5cGUiLCJhcmd1bWVudHMiLCJtb2R1bGUiLCJleHBvcnRzIiwibWV0YSIsImRvY3MiLCJ1cmwiLCJzY2hlbWEiXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7QUFDQTs7OztBQUVBOzs7O0FBQ0E7Ozs7OztBQUVBLFNBQVNBLE1BQVQsQ0FBZ0JDLE9BQWhCLEVBQXlCQyxJQUF6QixFQUErQjtBQUM3QkQsVUFBUUQsTUFBUixDQUFlO0FBQ2JFLFFBRGE7QUFFYkMsYUFBUztBQUZJLEdBQWY7QUFJRDs7QUFFRCxTQUFTQyxXQUFULENBQXFCQyxLQUFyQixFQUE0QkMsUUFBNUIsRUFBc0NDLE1BQXRDLEVBQThDO0FBQzVDLE1BQUksQ0FBQ0MsTUFBTUMsT0FBTixDQUFjSixLQUFkLENBQUwsRUFBMkI7QUFDekIsV0FBTyxLQUFQLENBRHlCLENBQ1o7QUFDZDs7QUFFRCxNQUFJSyxRQUFKOztBQUVBLE1BQUlILE9BQU8sQ0FBUCxNQUFjLEdBQWQsSUFBcUJBLE9BQU8sQ0FBUCxNQUFjLEdBQXZDLEVBQTRDO0FBQUU7QUFDNUNHLGVBQVdILE1BQVg7QUFDRCxHQUZELE1BRU87QUFDTEcsZUFBVyxlQUFLQyxPQUFMLENBQWEsZUFBS0MsT0FBTCxDQUFhTixRQUFiLENBQWIsRUFBcUNDLE1BQXJDLENBQVgsQ0FESyxDQUNtRDtBQUN6RDs7QUFFRCxTQUFPRixNQUFNUSxJQUFOLENBQVdDLFFBQ2hCLHlCQUFVSixRQUFWLEVBQW9CSSxJQUFwQixLQUNBLHlCQUFVSixRQUFWLEVBQW9CLGVBQUtLLElBQUwsQ0FBVUMsUUFBUUMsR0FBUixFQUFWLEVBQXlCSCxJQUF6QixDQUFwQixDQUZLLE1BR0FJLFNBSFA7QUFJRDs7QUFFRCxTQUFTQyxNQUFULENBQWdCbEIsT0FBaEIsRUFBeUI7QUFDdkIsUUFBTW1CLFVBQVVuQixRQUFRbUIsT0FBUixDQUFnQixDQUFoQixLQUFzQixFQUF0QztBQUNBLFFBQU1kLFdBQVdMLFFBQVFvQixXQUFSLEVBQWpCO0FBQ0EsUUFBTUMsVUFBVWYsVUFBVUgsWUFBWWdCLFFBQVFHLEtBQXBCLEVBQTJCakIsUUFBM0IsRUFBcUNDLE1BQXJDLENBQTFCOztBQUVBLFNBQU87QUFDTGlCLHNCQUFrQnRCLElBQWxCLEVBQXdCO0FBQ3RCLFVBQUlBLEtBQUt1QixVQUFMLENBQWdCQyxNQUFoQixLQUEyQixDQUEzQixJQUFnQyxDQUFDSixRQUFRcEIsS0FBS0ssTUFBTCxDQUFZb0IsS0FBcEIsQ0FBckMsRUFBaUU7QUFDL0QzQixlQUFPQyxPQUFQLEVBQWdCQyxJQUFoQjtBQUNEO0FBQ0YsS0FMSTtBQU1MMEIsd0JBQW9CMUIsSUFBcEIsRUFBMEI7QUFDeEIsVUFBSUEsS0FBSzJCLFVBQUwsQ0FBZ0JDLElBQWhCLEtBQXlCLGdCQUF6QixJQUNGLDZCQUFnQjVCLEtBQUsyQixVQUFyQixDQURFLElBRUYsQ0FBQ1AsUUFBUXBCLEtBQUsyQixVQUFMLENBQWdCRSxTQUFoQixDQUEwQixDQUExQixFQUE2QkosS0FBckMsQ0FGSCxFQUVnRDtBQUM5QzNCLGVBQU9DLE9BQVAsRUFBZ0JDLEtBQUsyQixVQUFyQjtBQUNEO0FBQ0Y7QUFaSSxHQUFQO0FBY0Q7O0FBRURHLE9BQU9DLE9BQVAsR0FBaUI7QUFDZmQsUUFEZTtBQUVmZSxRQUFNO0FBQ0pDLFVBQU07QUFDSkMsV0FBSyx1QkFBUSxzQkFBUjtBQURELEtBREY7QUFJSkMsWUFBUSxDQUNOO0FBQ0UsY0FBUSxRQURWO0FBRUUsb0JBQWM7QUFDWiwyQkFBbUIsRUFBRSxRQUFRLENBQUMsU0FBRCxFQUFZLE9BQVosQ0FBVixFQURQO0FBRVosZ0NBQXdCLEVBQUUsUUFBUSxDQUFDLFNBQUQsRUFBWSxPQUFaLENBQVYsRUFGWjtBQUdaLDRCQUFvQixFQUFFLFFBQVEsQ0FBQyxTQUFELEVBQVksT0FBWixDQUFWLEVBSFI7QUFJWixpQkFBUztBQUNQLGtCQUFRLE9BREQ7QUFFUCxtQkFBUztBQUNQLG9CQUFRO0FBREQ7QUFGRjtBQUpHLE9BRmhCO0FBYUUsOEJBQXdCO0FBYjFCLEtBRE07QUFKSjtBQUZTLENBQWpCIiwiZmlsZSI6InJ1bGVzL25vLXVuYXNzaWduZWQtaW1wb3J0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBtaW5pbWF0Y2ggZnJvbSAnbWluaW1hdGNoJ1xuXG5pbXBvcnQgaXNTdGF0aWNSZXF1aXJlIGZyb20gJy4uL2NvcmUvc3RhdGljUmVxdWlyZSdcbmltcG9ydCBkb2NzVXJsIGZyb20gJy4uL2RvY3NVcmwnXG5cbmZ1bmN0aW9uIHJlcG9ydChjb250ZXh0LCBub2RlKSB7XG4gIGNvbnRleHQucmVwb3J0KHtcbiAgICBub2RlLFxuICAgIG1lc3NhZ2U6ICdJbXBvcnRlZCBtb2R1bGUgc2hvdWxkIGJlIGFzc2lnbmVkJyxcbiAgfSlcbn1cblxuZnVuY3Rpb24gdGVzdElzQWxsb3coZ2xvYnMsIGZpbGVuYW1lLCBzb3VyY2UpIHtcbiAgaWYgKCFBcnJheS5pc0FycmF5KGdsb2JzKSkge1xuICAgIHJldHVybiBmYWxzZSAvLyBkZWZhdWx0IGRvZXNuJ3QgYWxsb3cgYW55IHBhdHRlcm5zXG4gIH1cblxuICBsZXQgZmlsZVBhdGhcblxuICBpZiAoc291cmNlWzBdICE9PSAnLicgJiYgc291cmNlWzBdICE9PSAnLycpIHsgLy8gYSBub2RlIG1vZHVsZVxuICAgIGZpbGVQYXRoID0gc291cmNlXG4gIH0gZWxzZSB7XG4gICAgZmlsZVBhdGggPSBwYXRoLnJlc29sdmUocGF0aC5kaXJuYW1lKGZpbGVuYW1lKSwgc291cmNlKSAvLyBnZXQgc291cmNlIGFic29sdXRlIHBhdGhcbiAgfVxuXG4gIHJldHVybiBnbG9icy5maW5kKGdsb2IgPT4gKFxuICAgIG1pbmltYXRjaChmaWxlUGF0aCwgZ2xvYikgfHxcbiAgICBtaW5pbWF0Y2goZmlsZVBhdGgsIHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCBnbG9iKSlcbiAgKSkgIT09IHVuZGVmaW5lZFxufVxuXG5mdW5jdGlvbiBjcmVhdGUoY29udGV4dCkge1xuICBjb25zdCBvcHRpb25zID0gY29udGV4dC5vcHRpb25zWzBdIHx8IHt9XG4gIGNvbnN0IGZpbGVuYW1lID0gY29udGV4dC5nZXRGaWxlbmFtZSgpXG4gIGNvbnN0IGlzQWxsb3cgPSBzb3VyY2UgPT4gdGVzdElzQWxsb3cob3B0aW9ucy5hbGxvdywgZmlsZW5hbWUsIHNvdXJjZSlcblxuICByZXR1cm4ge1xuICAgIEltcG9ydERlY2xhcmF0aW9uKG5vZGUpIHtcbiAgICAgIGlmIChub2RlLnNwZWNpZmllcnMubGVuZ3RoID09PSAwICYmICFpc0FsbG93KG5vZGUuc291cmNlLnZhbHVlKSkge1xuICAgICAgICByZXBvcnQoY29udGV4dCwgbm9kZSlcbiAgICAgIH1cbiAgICB9LFxuICAgIEV4cHJlc3Npb25TdGF0ZW1lbnQobm9kZSkge1xuICAgICAgaWYgKG5vZGUuZXhwcmVzc2lvbi50eXBlID09PSAnQ2FsbEV4cHJlc3Npb24nICYmXG4gICAgICAgIGlzU3RhdGljUmVxdWlyZShub2RlLmV4cHJlc3Npb24pICYmXG4gICAgICAgICFpc0FsbG93KG5vZGUuZXhwcmVzc2lvbi5hcmd1bWVudHNbMF0udmFsdWUpKSB7XG4gICAgICAgIHJlcG9ydChjb250ZXh0LCBub2RlLmV4cHJlc3Npb24pXG4gICAgICB9XG4gICAgfSxcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgY3JlYXRlLFxuICBtZXRhOiB7XG4gICAgZG9jczoge1xuICAgICAgdXJsOiBkb2NzVXJsKCduby11bmFzc2lnbmVkLWltcG9ydCcpLFxuICAgIH0sXG4gICAgc2NoZW1hOiBbXG4gICAgICB7XG4gICAgICAgICd0eXBlJzogJ29iamVjdCcsXG4gICAgICAgICdwcm9wZXJ0aWVzJzoge1xuICAgICAgICAgICdkZXZEZXBlbmRlbmNpZXMnOiB7ICd0eXBlJzogWydib29sZWFuJywgJ2FycmF5J10gfSxcbiAgICAgICAgICAnb3B0aW9uYWxEZXBlbmRlbmNpZXMnOiB7ICd0eXBlJzogWydib29sZWFuJywgJ2FycmF5J10gfSxcbiAgICAgICAgICAncGVlckRlcGVuZGVuY2llcyc6IHsgJ3R5cGUnOiBbJ2Jvb2xlYW4nLCAnYXJyYXknXSB9LFxuICAgICAgICAgICdhbGxvdyc6IHtcbiAgICAgICAgICAgICd0eXBlJzogJ2FycmF5JyxcbiAgICAgICAgICAgICdpdGVtcyc6IHtcbiAgICAgICAgICAgICAgJ3R5cGUnOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgJ2FkZGl0aW9uYWxQcm9wZXJ0aWVzJzogZmFsc2UsXG4gICAgICB9LFxuICAgIF0sXG4gIH0sXG59XG4iXX0=