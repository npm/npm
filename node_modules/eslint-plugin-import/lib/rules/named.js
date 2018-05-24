'use strict';

var _path = require('path');

var path = _interopRequireWildcard(_path);

var _ExportMap = require('../ExportMap');

var _ExportMap2 = _interopRequireDefault(_ExportMap);

var _docsUrl = require('../docsUrl');

var _docsUrl2 = _interopRequireDefault(_docsUrl);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

module.exports = {
  meta: {
    docs: {
      url: (0, _docsUrl2.default)('named')
    }
  },

  create: function (context) {
    function checkSpecifiers(key, type, node) {
      if (node.source == null) return; // local export, ignore

      if (!node.specifiers.some(function (im) {
        return im.type === type;
      })) {
        return; // no named imports/exports
      }

      const imports = _ExportMap2.default.get(node.source.value, context);
      if (imports == null) return;

      if (imports.errors.length) {
        imports.reportErrors(context, node);
        return;
      }

      node.specifiers.forEach(function (im) {
        if (im.type !== type) return;

        const deepLookup = imports.hasDeep(im[key].name);

        if (!deepLookup.found) {
          if (deepLookup.path.length > 1) {
            const deepPath = deepLookup.path.map(i => path.relative(path.dirname(context.getFilename()), i.path)).join(' -> ');

            context.report(im[key], `${im[key].name} not found via ${deepPath}`);
          } else {
            context.report(im[key], im[key].name + ' not found in \'' + node.source.value + '\'');
          }
        }
      });
    }

    return {
      'ImportDeclaration': checkSpecifiers.bind(null, 'imported', 'ImportSpecifier'),

      'ExportNamedDeclaration': checkSpecifiers.bind(null, 'local', 'ExportSpecifier')
    };
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzL25hbWVkLmpzIl0sIm5hbWVzIjpbInBhdGgiLCJtb2R1bGUiLCJleHBvcnRzIiwibWV0YSIsImRvY3MiLCJ1cmwiLCJjcmVhdGUiLCJjb250ZXh0IiwiY2hlY2tTcGVjaWZpZXJzIiwia2V5IiwidHlwZSIsIm5vZGUiLCJzb3VyY2UiLCJzcGVjaWZpZXJzIiwic29tZSIsImltIiwiaW1wb3J0cyIsImdldCIsInZhbHVlIiwiZXJyb3JzIiwibGVuZ3RoIiwicmVwb3J0RXJyb3JzIiwiZm9yRWFjaCIsImRlZXBMb29rdXAiLCJoYXNEZWVwIiwibmFtZSIsImZvdW5kIiwiZGVlcFBhdGgiLCJtYXAiLCJpIiwicmVsYXRpdmUiLCJkaXJuYW1lIiwiZ2V0RmlsZW5hbWUiLCJqb2luIiwicmVwb3J0IiwiYmluZCJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7SUFBWUEsSTs7QUFDWjs7OztBQUNBOzs7Ozs7OztBQUVBQyxPQUFPQyxPQUFQLEdBQWlCO0FBQ2ZDLFFBQU07QUFDSkMsVUFBTTtBQUNKQyxXQUFLLHVCQUFRLE9BQVI7QUFERDtBQURGLEdBRFM7O0FBT2ZDLFVBQVEsVUFBVUMsT0FBVixFQUFtQjtBQUN6QixhQUFTQyxlQUFULENBQXlCQyxHQUF6QixFQUE4QkMsSUFBOUIsRUFBb0NDLElBQXBDLEVBQTBDO0FBQ3hDLFVBQUlBLEtBQUtDLE1BQUwsSUFBZSxJQUFuQixFQUF5QixPQURlLENBQ1I7O0FBRWhDLFVBQUksQ0FBQ0QsS0FBS0UsVUFBTCxDQUNFQyxJQURGLENBQ08sVUFBVUMsRUFBVixFQUFjO0FBQUUsZUFBT0EsR0FBR0wsSUFBSCxLQUFZQSxJQUFuQjtBQUF5QixPQURoRCxDQUFMLEVBQ3dEO0FBQ3RELGVBRHNELENBQy9DO0FBQ1I7O0FBRUQsWUFBTU0sVUFBVSxvQkFBUUMsR0FBUixDQUFZTixLQUFLQyxNQUFMLENBQVlNLEtBQXhCLEVBQStCWCxPQUEvQixDQUFoQjtBQUNBLFVBQUlTLFdBQVcsSUFBZixFQUFxQjs7QUFFckIsVUFBSUEsUUFBUUcsTUFBUixDQUFlQyxNQUFuQixFQUEyQjtBQUN6QkosZ0JBQVFLLFlBQVIsQ0FBcUJkLE9BQXJCLEVBQThCSSxJQUE5QjtBQUNBO0FBQ0Q7O0FBRURBLFdBQUtFLFVBQUwsQ0FBZ0JTLE9BQWhCLENBQXdCLFVBQVVQLEVBQVYsRUFBYztBQUNwQyxZQUFJQSxHQUFHTCxJQUFILEtBQVlBLElBQWhCLEVBQXNCOztBQUV0QixjQUFNYSxhQUFhUCxRQUFRUSxPQUFSLENBQWdCVCxHQUFHTixHQUFILEVBQVFnQixJQUF4QixDQUFuQjs7QUFFQSxZQUFJLENBQUNGLFdBQVdHLEtBQWhCLEVBQXVCO0FBQ3JCLGNBQUlILFdBQVd2QixJQUFYLENBQWdCb0IsTUFBaEIsR0FBeUIsQ0FBN0IsRUFBZ0M7QUFDOUIsa0JBQU1PLFdBQVdKLFdBQVd2QixJQUFYLENBQ2Q0QixHQURjLENBQ1ZDLEtBQUs3QixLQUFLOEIsUUFBTCxDQUFjOUIsS0FBSytCLE9BQUwsQ0FBYXhCLFFBQVF5QixXQUFSLEVBQWIsQ0FBZCxFQUFtREgsRUFBRTdCLElBQXJELENBREssRUFFZGlDLElBRmMsQ0FFVCxNQUZTLENBQWpCOztBQUlBMUIsb0JBQVEyQixNQUFSLENBQWVuQixHQUFHTixHQUFILENBQWYsRUFDRyxHQUFFTSxHQUFHTixHQUFILEVBQVFnQixJQUFLLGtCQUFpQkUsUUFBUyxFQUQ1QztBQUVELFdBUEQsTUFPTztBQUNMcEIsb0JBQVEyQixNQUFSLENBQWVuQixHQUFHTixHQUFILENBQWYsRUFDRU0sR0FBR04sR0FBSCxFQUFRZ0IsSUFBUixHQUFlLGtCQUFmLEdBQW9DZCxLQUFLQyxNQUFMLENBQVlNLEtBQWhELEdBQXdELElBRDFEO0FBRUQ7QUFDRjtBQUNGLE9BbEJEO0FBbUJEOztBQUVELFdBQU87QUFDTCwyQkFBcUJWLGdCQUFnQjJCLElBQWhCLENBQXNCLElBQXRCLEVBQ3NCLFVBRHRCLEVBRXNCLGlCQUZ0QixDQURoQjs7QUFNTCxnQ0FBMEIzQixnQkFBZ0IyQixJQUFoQixDQUFzQixJQUF0QixFQUNzQixPQUR0QixFQUVzQixpQkFGdEI7QUFOckIsS0FBUDtBQVlEO0FBekRjLENBQWpCIiwiZmlsZSI6InJ1bGVzL25hbWVkLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IEV4cG9ydHMgZnJvbSAnLi4vRXhwb3J0TWFwJ1xuaW1wb3J0IGRvY3NVcmwgZnJvbSAnLi4vZG9jc1VybCdcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIG1ldGE6IHtcbiAgICBkb2NzOiB7XG4gICAgICB1cmw6IGRvY3NVcmwoJ25hbWVkJyksXG4gICAgfSxcbiAgfSxcblxuICBjcmVhdGU6IGZ1bmN0aW9uIChjb250ZXh0KSB7XG4gICAgZnVuY3Rpb24gY2hlY2tTcGVjaWZpZXJzKGtleSwgdHlwZSwgbm9kZSkge1xuICAgICAgaWYgKG5vZGUuc291cmNlID09IG51bGwpIHJldHVybiAvLyBsb2NhbCBleHBvcnQsIGlnbm9yZVxuXG4gICAgICBpZiAoIW5vZGUuc3BlY2lmaWVyc1xuICAgICAgICAgICAgLnNvbWUoZnVuY3Rpb24gKGltKSB7IHJldHVybiBpbS50eXBlID09PSB0eXBlIH0pKSB7XG4gICAgICAgIHJldHVybiAvLyBubyBuYW1lZCBpbXBvcnRzL2V4cG9ydHNcbiAgICAgIH1cblxuICAgICAgY29uc3QgaW1wb3J0cyA9IEV4cG9ydHMuZ2V0KG5vZGUuc291cmNlLnZhbHVlLCBjb250ZXh0KVxuICAgICAgaWYgKGltcG9ydHMgPT0gbnVsbCkgcmV0dXJuXG5cbiAgICAgIGlmIChpbXBvcnRzLmVycm9ycy5sZW5ndGgpIHtcbiAgICAgICAgaW1wb3J0cy5yZXBvcnRFcnJvcnMoY29udGV4dCwgbm9kZSlcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIG5vZGUuc3BlY2lmaWVycy5mb3JFYWNoKGZ1bmN0aW9uIChpbSkge1xuICAgICAgICBpZiAoaW0udHlwZSAhPT0gdHlwZSkgcmV0dXJuXG5cbiAgICAgICAgY29uc3QgZGVlcExvb2t1cCA9IGltcG9ydHMuaGFzRGVlcChpbVtrZXldLm5hbWUpXG5cbiAgICAgICAgaWYgKCFkZWVwTG9va3VwLmZvdW5kKSB7XG4gICAgICAgICAgaWYgKGRlZXBMb29rdXAucGF0aC5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICBjb25zdCBkZWVwUGF0aCA9IGRlZXBMb29rdXAucGF0aFxuICAgICAgICAgICAgICAubWFwKGkgPT4gcGF0aC5yZWxhdGl2ZShwYXRoLmRpcm5hbWUoY29udGV4dC5nZXRGaWxlbmFtZSgpKSwgaS5wYXRoKSlcbiAgICAgICAgICAgICAgLmpvaW4oJyAtPiAnKVxuXG4gICAgICAgICAgICBjb250ZXh0LnJlcG9ydChpbVtrZXldLFxuICAgICAgICAgICAgICBgJHtpbVtrZXldLm5hbWV9IG5vdCBmb3VuZCB2aWEgJHtkZWVwUGF0aH1gKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb250ZXh0LnJlcG9ydChpbVtrZXldLFxuICAgICAgICAgICAgICBpbVtrZXldLm5hbWUgKyAnIG5vdCBmb3VuZCBpbiBcXCcnICsgbm9kZS5zb3VyY2UudmFsdWUgKyAnXFwnJylcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICdJbXBvcnREZWNsYXJhdGlvbic6IGNoZWNrU3BlY2lmaWVycy5iaW5kKCBudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICwgJ2ltcG9ydGVkJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAsICdJbXBvcnRTcGVjaWZpZXInXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICksXG5cbiAgICAgICdFeHBvcnROYW1lZERlY2xhcmF0aW9uJzogY2hlY2tTcGVjaWZpZXJzLmJpbmQoIG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAsICdsb2NhbCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAsICdFeHBvcnRTcGVjaWZpZXInXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSxcbiAgICB9XG5cbiAgfSxcbn1cbiJdfQ==