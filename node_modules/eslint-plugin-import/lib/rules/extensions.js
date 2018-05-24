'use strict';

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _resolve = require('eslint-module-utils/resolve');

var _resolve2 = _interopRequireDefault(_resolve);

var _importType = require('../core/importType');

var _docsUrl = require('../docsUrl');

var _docsUrl2 = _interopRequireDefault(_docsUrl);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const enumValues = { enum: ['always', 'ignorePackages', 'never'] };
const patternProperties = {
  type: 'object',
  patternProperties: { '.*': enumValues }
};
const properties = {
  type: 'object',
  properties: {
    'pattern': patternProperties,
    'ignorePackages': { type: 'boolean' }
  }
};

function buildProperties(context) {

  const result = {
    defaultConfig: 'never',
    pattern: {},
    ignorePackages: false
  };

  context.options.forEach(obj => {

    // If this is a string, set defaultConfig to its value
    if (typeof obj === 'string') {
      result.defaultConfig = obj;
      return;
    }

    // If this is not the new structure, transfer all props to result.pattern
    if (obj.pattern === undefined && obj.ignorePackages === undefined) {
      Object.assign(result.pattern, obj);
      return;
    }

    // If pattern is provided, transfer all props
    if (obj.pattern !== undefined) {
      Object.assign(result.pattern, obj.pattern);
    }

    // If ignorePackages is provided, transfer it to result
    if (obj.ignorePackages !== undefined) {
      result.ignorePackages = obj.ignorePackages;
    }
  });

  return result;
}

module.exports = {
  meta: {
    docs: {
      url: (0, _docsUrl2.default)('extensions')
    },

    schema: {
      anyOf: [{
        type: 'array',
        items: [enumValues],
        additionalItems: false
      }, {
        type: 'array',
        items: [enumValues, properties],
        additionalItems: false
      }, {
        type: 'array',
        items: [properties],
        additionalItems: false
      }, {
        type: 'array',
        items: [patternProperties],
        additionalItems: false
      }, {
        type: 'array',
        items: [enumValues, patternProperties],
        additionalItems: false
      }]
    }
  },

  create: function (context) {

    const props = buildProperties(context);

    function getModifier(extension) {
      return props.pattern[extension] || props.defaultConfig;
    }

    function isUseOfExtensionRequired(extension, isPackageMain) {
      return getModifier(extension) === 'always' && (!props.ignorePackages || !isPackageMain);
    }

    function isUseOfExtensionForbidden(extension) {
      return getModifier(extension) === 'never';
    }

    function isResolvableWithoutExtension(file) {
      const extension = _path2.default.extname(file);
      const fileWithoutExtension = file.slice(0, -extension.length);
      const resolvedFileWithoutExtension = (0, _resolve2.default)(fileWithoutExtension, context);

      return resolvedFileWithoutExtension === (0, _resolve2.default)(file, context);
    }

    function checkFileExtension(node) {
      const source = node.source;

      // bail if the declaration doesn't have a source, e.g. "export { foo };"

      if (!source) return;

      const importPath = source.value;

      // don't enforce anything on builtins
      if ((0, _importType.isBuiltIn)(importPath, context.settings)) return;

      const resolvedPath = (0, _resolve2.default)(importPath, context);

      // get extension from resolved path, if possible.
      // for unresolved, use source value.
      const extension = _path2.default.extname(resolvedPath || importPath).substring(1);

      // determine if this is a module
      const isPackageMain = (0, _importType.isExternalModuleMain)(importPath, context.settings) || (0, _importType.isScopedMain)(importPath);

      if (!extension || !importPath.endsWith(`.${extension}`)) {
        const extensionRequired = isUseOfExtensionRequired(extension, isPackageMain);
        const extensionForbidden = isUseOfExtensionForbidden(extension);
        if (extensionRequired && !extensionForbidden) {
          context.report({
            node: source,
            message: `Missing file extension ${extension ? `"${extension}" ` : ''}for "${importPath}"`
          });
        }
      } else if (extension) {
        if (isUseOfExtensionForbidden(extension) && isResolvableWithoutExtension(importPath)) {
          context.report({
            node: source,
            message: `Unexpected use of file extension "${extension}" for "${importPath}"`
          });
        }
      }
    }

    return {
      ImportDeclaration: checkFileExtension,
      ExportNamedDeclaration: checkFileExtension
    };
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzL2V4dGVuc2lvbnMuanMiXSwibmFtZXMiOlsiZW51bVZhbHVlcyIsImVudW0iLCJwYXR0ZXJuUHJvcGVydGllcyIsInR5cGUiLCJwcm9wZXJ0aWVzIiwiYnVpbGRQcm9wZXJ0aWVzIiwiY29udGV4dCIsInJlc3VsdCIsImRlZmF1bHRDb25maWciLCJwYXR0ZXJuIiwiaWdub3JlUGFja2FnZXMiLCJvcHRpb25zIiwiZm9yRWFjaCIsIm9iaiIsInVuZGVmaW5lZCIsIk9iamVjdCIsImFzc2lnbiIsIm1vZHVsZSIsImV4cG9ydHMiLCJtZXRhIiwiZG9jcyIsInVybCIsInNjaGVtYSIsImFueU9mIiwiaXRlbXMiLCJhZGRpdGlvbmFsSXRlbXMiLCJjcmVhdGUiLCJwcm9wcyIsImdldE1vZGlmaWVyIiwiZXh0ZW5zaW9uIiwiaXNVc2VPZkV4dGVuc2lvblJlcXVpcmVkIiwiaXNQYWNrYWdlTWFpbiIsImlzVXNlT2ZFeHRlbnNpb25Gb3JiaWRkZW4iLCJpc1Jlc29sdmFibGVXaXRob3V0RXh0ZW5zaW9uIiwiZmlsZSIsImV4dG5hbWUiLCJmaWxlV2l0aG91dEV4dGVuc2lvbiIsInNsaWNlIiwibGVuZ3RoIiwicmVzb2x2ZWRGaWxlV2l0aG91dEV4dGVuc2lvbiIsImNoZWNrRmlsZUV4dGVuc2lvbiIsIm5vZGUiLCJzb3VyY2UiLCJpbXBvcnRQYXRoIiwidmFsdWUiLCJzZXR0aW5ncyIsInJlc29sdmVkUGF0aCIsInN1YnN0cmluZyIsImVuZHNXaXRoIiwiZXh0ZW5zaW9uUmVxdWlyZWQiLCJleHRlbnNpb25Gb3JiaWRkZW4iLCJyZXBvcnQiLCJtZXNzYWdlIiwiSW1wb3J0RGVjbGFyYXRpb24iLCJFeHBvcnROYW1lZERlY2xhcmF0aW9uIl0sIm1hcHBpbmdzIjoiOztBQUFBOzs7O0FBRUE7Ozs7QUFDQTs7QUFDQTs7Ozs7O0FBRUEsTUFBTUEsYUFBYSxFQUFFQyxNQUFNLENBQUUsUUFBRixFQUFZLGdCQUFaLEVBQThCLE9BQTlCLENBQVIsRUFBbkI7QUFDQSxNQUFNQyxvQkFBb0I7QUFDeEJDLFFBQU0sUUFEa0I7QUFFeEJELHFCQUFtQixFQUFFLE1BQU1GLFVBQVI7QUFGSyxDQUExQjtBQUlBLE1BQU1JLGFBQWE7QUFDakJELFFBQU0sUUFEVztBQUVqQkMsY0FBWTtBQUNWLGVBQVdGLGlCQUREO0FBRVYsc0JBQWtCLEVBQUVDLE1BQU0sU0FBUjtBQUZSO0FBRkssQ0FBbkI7O0FBUUEsU0FBU0UsZUFBVCxDQUF5QkMsT0FBekIsRUFBa0M7O0FBRTlCLFFBQU1DLFNBQVM7QUFDYkMsbUJBQWUsT0FERjtBQUViQyxhQUFTLEVBRkk7QUFHYkMsb0JBQWdCO0FBSEgsR0FBZjs7QUFNQUosVUFBUUssT0FBUixDQUFnQkMsT0FBaEIsQ0FBd0JDLE9BQU87O0FBRTdCO0FBQ0EsUUFBSSxPQUFPQSxHQUFQLEtBQWUsUUFBbkIsRUFBNkI7QUFDM0JOLGFBQU9DLGFBQVAsR0FBdUJLLEdBQXZCO0FBQ0E7QUFDRDs7QUFFRDtBQUNBLFFBQUlBLElBQUlKLE9BQUosS0FBZ0JLLFNBQWhCLElBQTZCRCxJQUFJSCxjQUFKLEtBQXVCSSxTQUF4RCxFQUFtRTtBQUNqRUMsYUFBT0MsTUFBUCxDQUFjVCxPQUFPRSxPQUFyQixFQUE4QkksR0FBOUI7QUFDQTtBQUNEOztBQUVEO0FBQ0EsUUFBSUEsSUFBSUosT0FBSixLQUFnQkssU0FBcEIsRUFBK0I7QUFDN0JDLGFBQU9DLE1BQVAsQ0FBY1QsT0FBT0UsT0FBckIsRUFBOEJJLElBQUlKLE9BQWxDO0FBQ0Q7O0FBRUQ7QUFDQSxRQUFJSSxJQUFJSCxjQUFKLEtBQXVCSSxTQUEzQixFQUFzQztBQUNwQ1AsYUFBT0csY0FBUCxHQUF3QkcsSUFBSUgsY0FBNUI7QUFDRDtBQUNGLEdBdkJEOztBQXlCQSxTQUFPSCxNQUFQO0FBQ0g7O0FBRURVLE9BQU9DLE9BQVAsR0FBaUI7QUFDZkMsUUFBTTtBQUNKQyxVQUFNO0FBQ0pDLFdBQUssdUJBQVEsWUFBUjtBQURELEtBREY7O0FBS0pDLFlBQVE7QUFDTkMsYUFBTyxDQUNMO0FBQ0VwQixjQUFNLE9BRFI7QUFFRXFCLGVBQU8sQ0FBQ3hCLFVBQUQsQ0FGVDtBQUdFeUIseUJBQWlCO0FBSG5CLE9BREssRUFNTDtBQUNFdEIsY0FBTSxPQURSO0FBRUVxQixlQUFPLENBQ0x4QixVQURLLEVBRUxJLFVBRkssQ0FGVDtBQU1FcUIseUJBQWlCO0FBTm5CLE9BTkssRUFjTDtBQUNFdEIsY0FBTSxPQURSO0FBRUVxQixlQUFPLENBQUNwQixVQUFELENBRlQ7QUFHRXFCLHlCQUFpQjtBQUhuQixPQWRLLEVBbUJMO0FBQ0V0QixjQUFNLE9BRFI7QUFFRXFCLGVBQU8sQ0FBQ3RCLGlCQUFELENBRlQ7QUFHRXVCLHlCQUFpQjtBQUhuQixPQW5CSyxFQXdCTDtBQUNFdEIsY0FBTSxPQURSO0FBRUVxQixlQUFPLENBQ0x4QixVQURLLEVBRUxFLGlCQUZLLENBRlQ7QUFNRXVCLHlCQUFpQjtBQU5uQixPQXhCSztBQUREO0FBTEosR0FEUzs7QUEyQ2ZDLFVBQVEsVUFBVXBCLE9BQVYsRUFBbUI7O0FBRXpCLFVBQU1xQixRQUFRdEIsZ0JBQWdCQyxPQUFoQixDQUFkOztBQUVBLGFBQVNzQixXQUFULENBQXFCQyxTQUFyQixFQUFnQztBQUM5QixhQUFPRixNQUFNbEIsT0FBTixDQUFjb0IsU0FBZCxLQUE0QkYsTUFBTW5CLGFBQXpDO0FBQ0Q7O0FBRUQsYUFBU3NCLHdCQUFULENBQWtDRCxTQUFsQyxFQUE2Q0UsYUFBN0MsRUFBNEQ7QUFDMUQsYUFBT0gsWUFBWUMsU0FBWixNQUEyQixRQUEzQixLQUF3QyxDQUFDRixNQUFNakIsY0FBUCxJQUF5QixDQUFDcUIsYUFBbEUsQ0FBUDtBQUNEOztBQUVELGFBQVNDLHlCQUFULENBQW1DSCxTQUFuQyxFQUE4QztBQUM1QyxhQUFPRCxZQUFZQyxTQUFaLE1BQTJCLE9BQWxDO0FBQ0Q7O0FBRUQsYUFBU0ksNEJBQVQsQ0FBc0NDLElBQXRDLEVBQTRDO0FBQzFDLFlBQU1MLFlBQVksZUFBS00sT0FBTCxDQUFhRCxJQUFiLENBQWxCO0FBQ0EsWUFBTUUsdUJBQXVCRixLQUFLRyxLQUFMLENBQVcsQ0FBWCxFQUFjLENBQUNSLFVBQVVTLE1BQXpCLENBQTdCO0FBQ0EsWUFBTUMsK0JBQStCLHVCQUFRSCxvQkFBUixFQUE4QjlCLE9BQTlCLENBQXJDOztBQUVBLGFBQU9pQyxpQ0FBaUMsdUJBQVFMLElBQVIsRUFBYzVCLE9BQWQsQ0FBeEM7QUFDRDs7QUFFRCxhQUFTa0Msa0JBQVQsQ0FBNEJDLElBQTVCLEVBQWtDO0FBQUEsWUFDeEJDLE1BRHdCLEdBQ2JELElBRGEsQ0FDeEJDLE1BRHdCOztBQUdoQzs7QUFDQSxVQUFJLENBQUNBLE1BQUwsRUFBYTs7QUFFYixZQUFNQyxhQUFhRCxPQUFPRSxLQUExQjs7QUFFQTtBQUNBLFVBQUksMkJBQVVELFVBQVYsRUFBc0JyQyxRQUFRdUMsUUFBOUIsQ0FBSixFQUE2Qzs7QUFFN0MsWUFBTUMsZUFBZSx1QkFBUUgsVUFBUixFQUFvQnJDLE9BQXBCLENBQXJCOztBQUVBO0FBQ0E7QUFDQSxZQUFNdUIsWUFBWSxlQUFLTSxPQUFMLENBQWFXLGdCQUFnQkgsVUFBN0IsRUFBeUNJLFNBQXpDLENBQW1ELENBQW5ELENBQWxCOztBQUVBO0FBQ0EsWUFBTWhCLGdCQUFnQixzQ0FBcUJZLFVBQXJCLEVBQWlDckMsUUFBUXVDLFFBQXpDLEtBQ2pCLDhCQUFhRixVQUFiLENBREw7O0FBR0EsVUFBSSxDQUFDZCxTQUFELElBQWMsQ0FBQ2MsV0FBV0ssUUFBWCxDQUFxQixJQUFHbkIsU0FBVSxFQUFsQyxDQUFuQixFQUF5RDtBQUN2RCxjQUFNb0Isb0JBQW9CbkIseUJBQXlCRCxTQUF6QixFQUFvQ0UsYUFBcEMsQ0FBMUI7QUFDQSxjQUFNbUIscUJBQXFCbEIsMEJBQTBCSCxTQUExQixDQUEzQjtBQUNBLFlBQUlvQixxQkFBcUIsQ0FBQ0Msa0JBQTFCLEVBQThDO0FBQzVDNUMsa0JBQVE2QyxNQUFSLENBQWU7QUFDYlYsa0JBQU1DLE1BRE87QUFFYlUscUJBQ0csMEJBQXlCdkIsWUFBYSxJQUFHQSxTQUFVLElBQTFCLEdBQWdDLEVBQUcsUUFBT2MsVUFBVztBQUhwRSxXQUFmO0FBS0Q7QUFDRixPQVZELE1BVU8sSUFBSWQsU0FBSixFQUFlO0FBQ3BCLFlBQUlHLDBCQUEwQkgsU0FBMUIsS0FBd0NJLDZCQUE2QlUsVUFBN0IsQ0FBNUMsRUFBc0Y7QUFDcEZyQyxrQkFBUTZDLE1BQVIsQ0FBZTtBQUNiVixrQkFBTUMsTUFETztBQUViVSxxQkFBVSxxQ0FBb0N2QixTQUFVLFVBQVNjLFVBQVc7QUFGL0QsV0FBZjtBQUlEO0FBQ0Y7QUFDRjs7QUFFRCxXQUFPO0FBQ0xVLHlCQUFtQmIsa0JBRGQ7QUFFTGMsOEJBQXdCZDtBQUZuQixLQUFQO0FBSUQ7QUFoSGMsQ0FBakIiLCJmaWxlIjoicnVsZXMvZXh0ZW5zaW9ucy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXG5cbmltcG9ydCByZXNvbHZlIGZyb20gJ2VzbGludC1tb2R1bGUtdXRpbHMvcmVzb2x2ZSdcbmltcG9ydCB7IGlzQnVpbHRJbiwgaXNFeHRlcm5hbE1vZHVsZU1haW4sIGlzU2NvcGVkTWFpbiB9IGZyb20gJy4uL2NvcmUvaW1wb3J0VHlwZSdcbmltcG9ydCBkb2NzVXJsIGZyb20gJy4uL2RvY3NVcmwnXG5cbmNvbnN0IGVudW1WYWx1ZXMgPSB7IGVudW06IFsgJ2Fsd2F5cycsICdpZ25vcmVQYWNrYWdlcycsICduZXZlcicgXSB9XG5jb25zdCBwYXR0ZXJuUHJvcGVydGllcyA9IHtcbiAgdHlwZTogJ29iamVjdCcsXG4gIHBhdHRlcm5Qcm9wZXJ0aWVzOiB7ICcuKic6IGVudW1WYWx1ZXMgfSxcbn1cbmNvbnN0IHByb3BlcnRpZXMgPSB7XG4gIHR5cGU6ICdvYmplY3QnLFxuICBwcm9wZXJ0aWVzOiB7XG4gICAgJ3BhdHRlcm4nOiBwYXR0ZXJuUHJvcGVydGllcyxcbiAgICAnaWdub3JlUGFja2FnZXMnOiB7IHR5cGU6ICdib29sZWFuJyB9LFxuICB9LFxufVxuXG5mdW5jdGlvbiBidWlsZFByb3BlcnRpZXMoY29udGV4dCkge1xuXG4gICAgY29uc3QgcmVzdWx0ID0ge1xuICAgICAgZGVmYXVsdENvbmZpZzogJ25ldmVyJyxcbiAgICAgIHBhdHRlcm46IHt9LFxuICAgICAgaWdub3JlUGFja2FnZXM6IGZhbHNlLFxuICAgIH1cblxuICAgIGNvbnRleHQub3B0aW9ucy5mb3JFYWNoKG9iaiA9PiB7XG5cbiAgICAgIC8vIElmIHRoaXMgaXMgYSBzdHJpbmcsIHNldCBkZWZhdWx0Q29uZmlnIHRvIGl0cyB2YWx1ZVxuICAgICAgaWYgKHR5cGVvZiBvYmogPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJlc3VsdC5kZWZhdWx0Q29uZmlnID0gb2JqXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICAvLyBJZiB0aGlzIGlzIG5vdCB0aGUgbmV3IHN0cnVjdHVyZSwgdHJhbnNmZXIgYWxsIHByb3BzIHRvIHJlc3VsdC5wYXR0ZXJuXG4gICAgICBpZiAob2JqLnBhdHRlcm4gPT09IHVuZGVmaW5lZCAmJiBvYmouaWdub3JlUGFja2FnZXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBPYmplY3QuYXNzaWduKHJlc3VsdC5wYXR0ZXJuLCBvYmopXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICAvLyBJZiBwYXR0ZXJuIGlzIHByb3ZpZGVkLCB0cmFuc2ZlciBhbGwgcHJvcHNcbiAgICAgIGlmIChvYmoucGF0dGVybiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIE9iamVjdC5hc3NpZ24ocmVzdWx0LnBhdHRlcm4sIG9iai5wYXR0ZXJuKVxuICAgICAgfVxuXG4gICAgICAvLyBJZiBpZ25vcmVQYWNrYWdlcyBpcyBwcm92aWRlZCwgdHJhbnNmZXIgaXQgdG8gcmVzdWx0XG4gICAgICBpZiAob2JqLmlnbm9yZVBhY2thZ2VzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmVzdWx0Lmlnbm9yZVBhY2thZ2VzID0gb2JqLmlnbm9yZVBhY2thZ2VzXG4gICAgICB9XG4gICAgfSlcblxuICAgIHJldHVybiByZXN1bHRcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIG1ldGE6IHtcbiAgICBkb2NzOiB7XG4gICAgICB1cmw6IGRvY3NVcmwoJ2V4dGVuc2lvbnMnKSxcbiAgICB9LFxuXG4gICAgc2NoZW1hOiB7XG4gICAgICBhbnlPZjogW1xuICAgICAgICB7XG4gICAgICAgICAgdHlwZTogJ2FycmF5JyxcbiAgICAgICAgICBpdGVtczogW2VudW1WYWx1ZXNdLFxuICAgICAgICAgIGFkZGl0aW9uYWxJdGVtczogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICB0eXBlOiAnYXJyYXknLFxuICAgICAgICAgIGl0ZW1zOiBbXG4gICAgICAgICAgICBlbnVtVmFsdWVzLFxuICAgICAgICAgICAgcHJvcGVydGllcyxcbiAgICAgICAgICBdLFxuICAgICAgICAgIGFkZGl0aW9uYWxJdGVtczogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICB0eXBlOiAnYXJyYXknLFxuICAgICAgICAgIGl0ZW1zOiBbcHJvcGVydGllc10sXG4gICAgICAgICAgYWRkaXRpb25hbEl0ZW1zOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgICAgaXRlbXM6IFtwYXR0ZXJuUHJvcGVydGllc10sXG4gICAgICAgICAgYWRkaXRpb25hbEl0ZW1zOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgICAgaXRlbXM6IFtcbiAgICAgICAgICAgIGVudW1WYWx1ZXMsXG4gICAgICAgICAgICBwYXR0ZXJuUHJvcGVydGllcyxcbiAgICAgICAgICBdLFxuICAgICAgICAgIGFkZGl0aW9uYWxJdGVtczogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0sXG4gIH0sXG5cbiAgY3JlYXRlOiBmdW5jdGlvbiAoY29udGV4dCkge1xuXG4gICAgY29uc3QgcHJvcHMgPSBidWlsZFByb3BlcnRpZXMoY29udGV4dClcblxuICAgIGZ1bmN0aW9uIGdldE1vZGlmaWVyKGV4dGVuc2lvbikge1xuICAgICAgcmV0dXJuIHByb3BzLnBhdHRlcm5bZXh0ZW5zaW9uXSB8fCBwcm9wcy5kZWZhdWx0Q29uZmlnXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNVc2VPZkV4dGVuc2lvblJlcXVpcmVkKGV4dGVuc2lvbiwgaXNQYWNrYWdlTWFpbikge1xuICAgICAgcmV0dXJuIGdldE1vZGlmaWVyKGV4dGVuc2lvbikgPT09ICdhbHdheXMnICYmICghcHJvcHMuaWdub3JlUGFja2FnZXMgfHwgIWlzUGFja2FnZU1haW4pXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNVc2VPZkV4dGVuc2lvbkZvcmJpZGRlbihleHRlbnNpb24pIHtcbiAgICAgIHJldHVybiBnZXRNb2RpZmllcihleHRlbnNpb24pID09PSAnbmV2ZXInXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNSZXNvbHZhYmxlV2l0aG91dEV4dGVuc2lvbihmaWxlKSB7XG4gICAgICBjb25zdCBleHRlbnNpb24gPSBwYXRoLmV4dG5hbWUoZmlsZSlcbiAgICAgIGNvbnN0IGZpbGVXaXRob3V0RXh0ZW5zaW9uID0gZmlsZS5zbGljZSgwLCAtZXh0ZW5zaW9uLmxlbmd0aClcbiAgICAgIGNvbnN0IHJlc29sdmVkRmlsZVdpdGhvdXRFeHRlbnNpb24gPSByZXNvbHZlKGZpbGVXaXRob3V0RXh0ZW5zaW9uLCBjb250ZXh0KVxuXG4gICAgICByZXR1cm4gcmVzb2x2ZWRGaWxlV2l0aG91dEV4dGVuc2lvbiA9PT0gcmVzb2x2ZShmaWxlLCBjb250ZXh0KVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNoZWNrRmlsZUV4dGVuc2lvbihub2RlKSB7XG4gICAgICBjb25zdCB7IHNvdXJjZSB9ID0gbm9kZVxuXG4gICAgICAvLyBiYWlsIGlmIHRoZSBkZWNsYXJhdGlvbiBkb2Vzbid0IGhhdmUgYSBzb3VyY2UsIGUuZy4gXCJleHBvcnQgeyBmb28gfTtcIlxuICAgICAgaWYgKCFzb3VyY2UpIHJldHVyblxuXG4gICAgICBjb25zdCBpbXBvcnRQYXRoID0gc291cmNlLnZhbHVlXG5cbiAgICAgIC8vIGRvbid0IGVuZm9yY2UgYW55dGhpbmcgb24gYnVpbHRpbnNcbiAgICAgIGlmIChpc0J1aWx0SW4oaW1wb3J0UGF0aCwgY29udGV4dC5zZXR0aW5ncykpIHJldHVyblxuXG4gICAgICBjb25zdCByZXNvbHZlZFBhdGggPSByZXNvbHZlKGltcG9ydFBhdGgsIGNvbnRleHQpXG5cbiAgICAgIC8vIGdldCBleHRlbnNpb24gZnJvbSByZXNvbHZlZCBwYXRoLCBpZiBwb3NzaWJsZS5cbiAgICAgIC8vIGZvciB1bnJlc29sdmVkLCB1c2Ugc291cmNlIHZhbHVlLlxuICAgICAgY29uc3QgZXh0ZW5zaW9uID0gcGF0aC5leHRuYW1lKHJlc29sdmVkUGF0aCB8fCBpbXBvcnRQYXRoKS5zdWJzdHJpbmcoMSlcblxuICAgICAgLy8gZGV0ZXJtaW5lIGlmIHRoaXMgaXMgYSBtb2R1bGVcbiAgICAgIGNvbnN0IGlzUGFja2FnZU1haW4gPSBpc0V4dGVybmFsTW9kdWxlTWFpbihpbXBvcnRQYXRoLCBjb250ZXh0LnNldHRpbmdzKVxuICAgICAgICB8fCBpc1Njb3BlZE1haW4oaW1wb3J0UGF0aClcblxuICAgICAgaWYgKCFleHRlbnNpb24gfHwgIWltcG9ydFBhdGguZW5kc1dpdGgoYC4ke2V4dGVuc2lvbn1gKSkge1xuICAgICAgICBjb25zdCBleHRlbnNpb25SZXF1aXJlZCA9IGlzVXNlT2ZFeHRlbnNpb25SZXF1aXJlZChleHRlbnNpb24sIGlzUGFja2FnZU1haW4pXG4gICAgICAgIGNvbnN0IGV4dGVuc2lvbkZvcmJpZGRlbiA9IGlzVXNlT2ZFeHRlbnNpb25Gb3JiaWRkZW4oZXh0ZW5zaW9uKVxuICAgICAgICBpZiAoZXh0ZW5zaW9uUmVxdWlyZWQgJiYgIWV4dGVuc2lvbkZvcmJpZGRlbikge1xuICAgICAgICAgIGNvbnRleHQucmVwb3J0KHtcbiAgICAgICAgICAgIG5vZGU6IHNvdXJjZSxcbiAgICAgICAgICAgIG1lc3NhZ2U6XG4gICAgICAgICAgICAgIGBNaXNzaW5nIGZpbGUgZXh0ZW5zaW9uICR7ZXh0ZW5zaW9uID8gYFwiJHtleHRlbnNpb259XCIgYCA6ICcnfWZvciBcIiR7aW1wb3J0UGF0aH1cImAsXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChleHRlbnNpb24pIHtcbiAgICAgICAgaWYgKGlzVXNlT2ZFeHRlbnNpb25Gb3JiaWRkZW4oZXh0ZW5zaW9uKSAmJiBpc1Jlc29sdmFibGVXaXRob3V0RXh0ZW5zaW9uKGltcG9ydFBhdGgpKSB7XG4gICAgICAgICAgY29udGV4dC5yZXBvcnQoe1xuICAgICAgICAgICAgbm9kZTogc291cmNlLFxuICAgICAgICAgICAgbWVzc2FnZTogYFVuZXhwZWN0ZWQgdXNlIG9mIGZpbGUgZXh0ZW5zaW9uIFwiJHtleHRlbnNpb259XCIgZm9yIFwiJHtpbXBvcnRQYXRofVwiYCxcbiAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIEltcG9ydERlY2xhcmF0aW9uOiBjaGVja0ZpbGVFeHRlbnNpb24sXG4gICAgICBFeHBvcnROYW1lZERlY2xhcmF0aW9uOiBjaGVja0ZpbGVFeHRlbnNpb24sXG4gICAgfVxuICB9LFxufVxuIl19