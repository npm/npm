'use strict';

var _ExportMap = require('../ExportMap');

var _ExportMap2 = _interopRequireDefault(_ExportMap);

var _importDeclaration = require('../importDeclaration');

var _importDeclaration2 = _interopRequireDefault(_importDeclaration);

var _docsUrl = require('../docsUrl');

var _docsUrl2 = _interopRequireDefault(_docsUrl);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
  meta: {
    docs: {
      url: (0, _docsUrl2.default)('no-named-as-default-member')
    }
  },

  create: function (context) {

    const fileImports = new Map();
    const allPropertyLookups = new Map();

    function handleImportDefault(node) {
      const declaration = (0, _importDeclaration2.default)(context);
      const exportMap = _ExportMap2.default.get(declaration.source.value, context);
      if (exportMap == null) return;

      if (exportMap.errors.length) {
        exportMap.reportErrors(context, declaration);
        return;
      }

      fileImports.set(node.local.name, {
        exportMap,
        sourcePath: declaration.source.value
      });
    }

    function storePropertyLookup(objectName, propName, node) {
      const lookups = allPropertyLookups.get(objectName) || [];
      lookups.push({ node, propName });
      allPropertyLookups.set(objectName, lookups);
    }

    function handlePropLookup(node) {
      const objectName = node.object.name;
      const propName = node.property.name;
      storePropertyLookup(objectName, propName, node);
    }

    function handleDestructuringAssignment(node) {
      const isDestructure = node.id.type === 'ObjectPattern' && node.init != null && node.init.type === 'Identifier';
      if (!isDestructure) return;

      const objectName = node.init.name;
      for (const _ref of node.id.properties) {
        const key = _ref.key;

        if (key == null) continue; // true for rest properties
        storePropertyLookup(objectName, key.name, key);
      }
    }

    function handleProgramExit() {
      allPropertyLookups.forEach((lookups, objectName) => {
        const fileImport = fileImports.get(objectName);
        if (fileImport == null) return;

        for (const _ref2 of lookups) {
          const propName = _ref2.propName;
          const node = _ref2.node;

          // the default import can have a "default" property
          if (propName === 'default') continue;
          if (!fileImport.exportMap.namespace.has(propName)) continue;

          context.report({
            node,
            message: `Caution: \`${objectName}\` also has a named export ` + `\`${propName}\`. Check if you meant to write ` + `\`import {${propName}} from '${fileImport.sourcePath}'\` ` + 'instead.'
          });
        }
      });
    }

    return {
      'ImportDefaultSpecifier': handleImportDefault,
      'MemberExpression': handlePropLookup,
      'VariableDeclarator': handleDestructuringAssignment,
      'Program:exit': handleProgramExit
    };
  }
}; /**
    * @fileoverview Rule to warn about potentially confused use of name exports
    * @author Desmond Brand
    * @copyright 2016 Desmond Brand. All rights reserved.
    * See LICENSE in root directory for full license.
    */
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzL25vLW5hbWVkLWFzLWRlZmF1bHQtbWVtYmVyLmpzIl0sIm5hbWVzIjpbIm1vZHVsZSIsImV4cG9ydHMiLCJtZXRhIiwiZG9jcyIsInVybCIsImNyZWF0ZSIsImNvbnRleHQiLCJmaWxlSW1wb3J0cyIsIk1hcCIsImFsbFByb3BlcnR5TG9va3VwcyIsImhhbmRsZUltcG9ydERlZmF1bHQiLCJub2RlIiwiZGVjbGFyYXRpb24iLCJleHBvcnRNYXAiLCJnZXQiLCJzb3VyY2UiLCJ2YWx1ZSIsImVycm9ycyIsImxlbmd0aCIsInJlcG9ydEVycm9ycyIsInNldCIsImxvY2FsIiwibmFtZSIsInNvdXJjZVBhdGgiLCJzdG9yZVByb3BlcnR5TG9va3VwIiwib2JqZWN0TmFtZSIsInByb3BOYW1lIiwibG9va3VwcyIsInB1c2giLCJoYW5kbGVQcm9wTG9va3VwIiwib2JqZWN0IiwicHJvcGVydHkiLCJoYW5kbGVEZXN0cnVjdHVyaW5nQXNzaWdubWVudCIsImlzRGVzdHJ1Y3R1cmUiLCJpZCIsInR5cGUiLCJpbml0IiwicHJvcGVydGllcyIsImtleSIsImhhbmRsZVByb2dyYW1FeGl0IiwiZm9yRWFjaCIsImZpbGVJbXBvcnQiLCJuYW1lc3BhY2UiLCJoYXMiLCJyZXBvcnQiLCJtZXNzYWdlIl0sIm1hcHBpbmdzIjoiOztBQU1BOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7O0FBRUE7QUFDQTtBQUNBOztBQUVBQSxPQUFPQyxPQUFQLEdBQWlCO0FBQ2ZDLFFBQU07QUFDSkMsVUFBTTtBQUNKQyxXQUFLLHVCQUFRLDRCQUFSO0FBREQ7QUFERixHQURTOztBQU9mQyxVQUFRLFVBQVNDLE9BQVQsRUFBa0I7O0FBRXhCLFVBQU1DLGNBQWMsSUFBSUMsR0FBSixFQUFwQjtBQUNBLFVBQU1DLHFCQUFxQixJQUFJRCxHQUFKLEVBQTNCOztBQUVBLGFBQVNFLG1CQUFULENBQTZCQyxJQUE3QixFQUFtQztBQUNqQyxZQUFNQyxjQUFjLGlDQUFrQk4sT0FBbEIsQ0FBcEI7QUFD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by1uYW1lZC1hcy1kZWZhdWx0LW1lbWJlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGZpbGVvdmVydmlldyBSdWxlIHRvIHdhcm4gYWJvdXQgcG90ZW50aWFsbHkgY29uZnVzZWQgdXNlIG9mIG5hbWUgZXhwb3J0c1xuICogQGF1dGhvciBEZXNtb25kIEJyYW5kXG4gKiBAY29weXJpZ2h0IDIwMTYgRGVzbW9uZCBCcmFuZC4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqIFNlZSBMSUNFTlNFIGluIHJvb3QgZGlyZWN0b3J5IGZvciBmdWxsIGxpY2Vuc2UuXG4gKi9cbmltcG9ydCBFeHBvcnRzIGZyb20gJy4uL0V4cG9ydE1hcCdcbmltcG9ydCBpbXBvcnREZWNsYXJhdGlvbiBmcm9tICcuLi9pbXBvcnREZWNsYXJhdGlvbidcbmltcG9ydCBkb2NzVXJsIGZyb20gJy4uL2RvY3NVcmwnXG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBSdWxlIERlZmluaXRpb25cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBtZXRhOiB7XG4gICAgZG9jczoge1xuICAgICAgdXJsOiBkb2NzVXJsKCduby1uYW1lZC1hcy1kZWZhdWx0LW1lbWJlcicpLFxuICAgIH0sXG4gIH0sXG5cbiAgY3JlYXRlOiBmdW5jdGlvbihjb250ZXh0KSB7XG5cbiAgICBjb25zdCBmaWxlSW1wb3J0cyA9IG5ldyBNYXAoKVxuICAgIGNvbnN0IGFsbFByb3BlcnR5TG9va3VwcyA9IG5ldyBNYXAoKVxuXG4gICAgZnVuY3Rpb24gaGFuZGxlSW1wb3J0RGVmYXVsdChub2RlKSB7XG4gICAgICBjb25zdCBkZWNsYXJhdGlvbiA9IGltcG9ydERlY2xhcmF0aW9uKGNvbnRleHQpXG4gICAgICBjb25zdCBleHBvcnRNYXAgPSBFeHBvcnRzLmdldChkZWNsYXJhdGlvbi5zb3VyY2UudmFsdWUsIGNvbnRleHQpXG4gICAgICBpZiAoZXhwb3J0TWFwID09IG51bGwpIHJldHVyblxuXG4gICAgICBpZiAoZXhwb3J0TWFwLmVycm9ycy5sZW5ndGgpIHtcbiAgICAgICAgZXhwb3J0TWFwLnJlcG9ydEVycm9ycyhjb250ZXh0LCBkZWNsYXJhdGlvbilcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIGZpbGVJbXBvcnRzLnNldChub2RlLmxvY2FsLm5hbWUsIHtcbiAgICAgICAgZXhwb3J0TWFwLFxuICAgICAgICBzb3VyY2VQYXRoOiBkZWNsYXJhdGlvbi5zb3VyY2UudmFsdWUsXG4gICAgICB9KVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHN0b3JlUHJvcGVydHlMb29rdXAob2JqZWN0TmFtZSwgcHJvcE5hbWUsIG5vZGUpIHtcbiAgICAgIGNvbnN0IGxvb2t1cHMgPSBhbGxQcm9wZXJ0eUxvb2t1cHMuZ2V0KG9iamVjdE5hbWUpIHx8IFtdXG4gICAgICBsb29rdXBzLnB1c2goe25vZGUsIHByb3BOYW1lfSlcbiAgICAgIGFsbFByb3BlcnR5TG9va3Vwcy5zZXQob2JqZWN0TmFtZSwgbG9va3VwcylcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoYW5kbGVQcm9wTG9va3VwKG5vZGUpIHtcbiAgICAgIGNvbnN0IG9iamVjdE5hbWUgPSBub2RlLm9iamVjdC5uYW1lXG4gICAgICBjb25zdCBwcm9wTmFtZSA9IG5vZGUucHJvcGVydHkubmFtZVxuICAgICAgc3RvcmVQcm9wZXJ0eUxvb2t1cChvYmplY3ROYW1lLCBwcm9wTmFtZSwgbm9kZSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoYW5kbGVEZXN0cnVjdHVyaW5nQXNzaWdubWVudChub2RlKSB7XG4gICAgICBjb25zdCBpc0Rlc3RydWN0dXJlID0gKFxuICAgICAgICBub2RlLmlkLnR5cGUgPT09ICdPYmplY3RQYXR0ZXJuJyAmJlxuICAgICAgICBub2RlLmluaXQgIT0gbnVsbCAmJlxuICAgICAgICBub2RlLmluaXQudHlwZSA9PT0gJ0lkZW50aWZpZXInXG4gICAgICApXG4gICAgICBpZiAoIWlzRGVzdHJ1Y3R1cmUpIHJldHVyblxuXG4gICAgICBjb25zdCBvYmplY3ROYW1lID0gbm9kZS5pbml0Lm5hbWVcbiAgICAgIGZvciAoY29uc3QgeyBrZXkgfSBvZiBub2RlLmlkLnByb3BlcnRpZXMpIHtcbiAgICAgICAgaWYgKGtleSA9PSBudWxsKSBjb250aW51ZSAgLy8gdHJ1ZSBmb3IgcmVzdCBwcm9wZXJ0aWVzXG4gICAgICAgIHN0b3JlUHJvcGVydHlMb29rdXAob2JqZWN0TmFtZSwga2V5Lm5hbWUsIGtleSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoYW5kbGVQcm9ncmFtRXhpdCgpIHtcbiAgICAgIGFsbFByb3BlcnR5TG9va3Vwcy5mb3JFYWNoKChsb29rdXBzLCBvYmplY3ROYW1lKSA9PiB7XG4gICAgICAgIGNvbnN0IGZpbGVJbXBvcnQgPSBmaWxlSW1wb3J0cy5nZXQob2JqZWN0TmFtZSlcbiAgICAgICAgaWYgKGZpbGVJbXBvcnQgPT0gbnVsbCkgcmV0dXJuXG5cbiAgICAgICAgZm9yIChjb25zdCB7cHJvcE5hbWUsIG5vZGV9IG9mIGxvb2t1cHMpIHtcbiAgICAgICAgICAvLyB0aGUgZGVmYXVsdCBpbXBvcnQgY2FuIGhhdmUgYSBcImRlZmF1bHRcIiBwcm9wZXJ0eVxuICAgICAgICAgIGlmIChwcm9wTmFtZSA9PT0gJ2RlZmF1bHQnKSBjb250aW51ZVxuICAgICAgICAgIGlmICghZmlsZUltcG9ydC5leHBvcnRNYXAubmFtZXNwYWNlLmhhcyhwcm9wTmFtZSkpIGNvbnRpbnVlXG5cbiAgICAgICAgICBjb250ZXh0LnJlcG9ydCh7XG4gICAgICAgICAgICBub2RlLFxuICAgICAgICAgICAgbWVzc2FnZTogKFxuICAgICAgICAgICAgICBgQ2F1dGlvbjogXFxgJHtvYmplY3ROYW1lfVxcYCBhbHNvIGhhcyBhIG5hbWVkIGV4cG9ydCBgICtcbiAgICAgICAgICAgICAgYFxcYCR7cHJvcE5hbWV9XFxgLiBDaGVjayBpZiB5b3UgbWVhbnQgdG8gd3JpdGUgYCArXG4gICAgICAgICAgICAgIGBcXGBpbXBvcnQgeyR7cHJvcE5hbWV9fSBmcm9tICcke2ZpbGVJbXBvcnQuc291cmNlUGF0aH0nXFxgIGAgK1xuICAgICAgICAgICAgICAnaW5zdGVhZC4nXG4gICAgICAgICAgICApLFxuICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICdJbXBvcnREZWZhdWx0U3BlY2lmaWVyJzogaGFuZGxlSW1wb3J0RGVmYXVsdCxcbiAgICAgICdNZW1iZXJFeHByZXNzaW9uJzogaGFuZGxlUHJvcExvb2t1cCxcbiAgICAgICdWYXJpYWJsZURlY2xhcmF0b3InOiBoYW5kbGVEZXN0cnVjdHVyaW5nQXNzaWdubWVudCxcbiAgICAgICdQcm9ncmFtOmV4aXQnOiBoYW5kbGVQcm9ncmFtRXhpdCxcbiAgICB9XG4gIH0sXG59XG4iXX0=