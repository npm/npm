'use strict';

var _declaredScope = require('eslint-module-utils/declaredScope');

var _declaredScope2 = _interopRequireDefault(_declaredScope);

var _ExportMap = require('../ExportMap');

var _ExportMap2 = _interopRequireDefault(_ExportMap);

var _importDeclaration = require('../importDeclaration');

var _importDeclaration2 = _interopRequireDefault(_importDeclaration);

var _docsUrl = require('../docsUrl');

var _docsUrl2 = _interopRequireDefault(_docsUrl);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = {
  meta: {
    docs: {
      url: (0, _docsUrl2.default)('namespace')
    },

    schema: [{
      'type': 'object',
      'properties': {
        'allowComputed': {
          'description': 'If `false`, will report computed (and thus, un-lintable) references ' + 'to namespace members.',
          'type': 'boolean',
          'default': false
        }
      },
      'additionalProperties': false
    }]
  },

  create: function namespaceRule(context) {

    // read options
    var _ref = context.options[0] || {},
        _ref$allowComputed = _ref.allowComputed;

    const allowComputed = _ref$allowComputed === undefined ? false : _ref$allowComputed;


    const namespaces = new Map();

    function makeMessage(last, namepath) {
      return `'${last.name}' not found in` + (namepath.length > 1 ? ' deeply ' : ' ') + `imported namespace '${namepath.join('.')}'.`;
    }

    return {

      // pick up all imports at body entry time, to properly respect hoisting
      'Program': function (_ref2) {
        let body = _ref2.body;

        function processBodyStatement(declaration) {
          if (declaration.type !== 'ImportDeclaration') return;

          if (declaration.specifiers.length === 0) return;

          const imports = _ExportMap2.default.get(declaration.source.value, context);
          if (imports == null) return null;

          if (imports.errors.length) {
            imports.reportErrors(context, declaration);
            return;
          }

          for (let specifier of declaration.specifiers) {
            switch (specifier.type) {
              case 'ImportNamespaceSpecifier':
                if (!imports.size) {
                  context.report(specifier, `No exported names found in module '${declaration.source.value}'.`);
                }
                namespaces.set(specifier.local.name, imports);
                break;
              case 'ImportDefaultSpecifier':
              case 'ImportSpecifier':
                {
                  const meta = imports.get(
                  // default to 'default' for default http://i.imgur.com/nj6qAWy.jpg
                  specifier.imported ? specifier.imported.name : 'default');
                  if (!meta || !meta.namespace) break;
                  namespaces.set(specifier.local.name, meta.namespace);
                  break;
                }
            }
          }
        }
        body.forEach(processBodyStatement);
      },

      // same as above, but does not add names to local map
      'ExportNamespaceSpecifier': function (namespace) {
        var declaration = (0, _importDeclaration2.default)(context);

        var imports = _ExportMap2.default.get(declaration.source.value, context);
        if (imports == null) return null;

        if (imports.errors.length) {
          imports.reportErrors(context, declaration);
          return;
        }

        if (!imports.size) {
          context.report(namespace, `No exported names found in module '${declaration.source.value}'.`);
        }
      },

      // todo: check for possible redefinition

      'MemberExpression': function (dereference) {
        if (dereference.object.type !== 'Identifier') return;
        if (!namespaces.has(dereference.object.name)) return;

        if (dereference.parent.type === 'AssignmentExpression' && dereference.parent.left === dereference) {
          context.report(dereference.parent, `Assignment to member of namespace '${dereference.object.name}'.`);
        }

        // go deep
        var namespace = namespaces.get(dereference.object.name);
        var namepath = [dereference.object.name];
        // while property is namespace and parent is member expression, keep validating
        while (namespace instanceof _ExportMap2.default && dereference.type === 'MemberExpression') {

          if (dereference.computed) {
            if (!allowComputed) {
              context.report(dereference.property, 'Unable to validate computed reference to imported namespace \'' + dereference.object.name + '\'.');
            }
            return;
          }

          if (!namespace.has(dereference.property.name)) {
            context.report(dereference.property, makeMessage(dereference.property, namepath));
            break;
          }

          const exported = namespace.get(dereference.property.name);
          if (exported == null) return;

          // stash and pop
          namepath.push(dereference.property.name);
          namespace = exported.namespace;
          dereference = dereference.parent;
        }
      },

      'VariableDeclarator': function (_ref3) {
        let id = _ref3.id,
            init = _ref3.init;

        if (init == null) return;
        if (init.type !== 'Identifier') return;
        if (!namespaces.has(init.name)) return;

        // check for redefinition in intermediate scopes
        if ((0, _declaredScope2.default)(context, init.name) !== 'module') return;

        // DFS traverse child namespaces
        function testKey(pattern, namespace) {
          let path = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [init.name];

          if (!(namespace instanceof _ExportMap2.default)) return;

          if (pattern.type !== 'ObjectPattern') return;

          for (let property of pattern.properties) {

            if (property.key.type !== 'Identifier') {
              context.report({
                node: property,
                message: 'Only destructure top-level names.'
              });
              continue;
            }

            if (!namespace.has(property.key.name)) {
              context.report({
                node: property,
                message: makeMessage(property.key, path)
              });
              continue;
            }

            path.push(property.key.name);
            testKey(property.value, namespace.get(property.key.name).namespace, path);
            path.pop();
          }
        }

        testKey(id, namespaces.get(init.name));
      }
    };
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzL25hbWVzcGFjZS5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnRzIiwibWV0YSIsImRvY3MiLCJ1cmwiLCJzY2hlbWEiLCJjcmVhdGUiLCJuYW1lc3BhY2VSdWxlIiwiY29udGV4dCIsIm9wdGlvbnMiLCJhbGxvd0NvbXB1dGVkIiwibmFtZXNwYWNlcyIsIk1hcCIsIm1ha2VNZXNzYWdlIiwibGFzdCIsIm5hbWVwYXRoIiwibmFtZSIsImxlbmd0aCIsImpvaW4iLCJib2R5IiwicHJvY2Vzc0JvZHlTdGF0ZW1lbnQiLCJkZWNsYXJhdGlvbiIsInR5cGUiLCJzcGVjaWZpZXJzIiwiaW1wb3J0cyIsImdldCIsInNvdXJjZSIsInZhbHVlIiwiZXJyb3JzIiwicmVwb3J0RXJyb3JzIiwic3BlY2lmaWVyIiwic2l6ZSIsInJlcG9ydCIsInNldCIsImxvY2FsIiwiaW1wb3J0ZWQiLCJuYW1lc3BhY2UiLCJmb3JFYWNoIiwiZGVyZWZlcmVuY2UiLCJvYmplY3QiLCJoYXMiLCJwYXJlbnQiLCJsZWZ0IiwiY29tcHV0ZWQiLCJwcm9wZXJ0eSIsImV4cG9ydGVkIiwicHVzaCIsImlkIiwiaW5pdCIsInRlc3RLZXkiLCJwYXR0ZXJuIiwicGF0aCIsInByb3BlcnRpZXMiLCJrZXkiLCJub2RlIiwibWVzc2FnZSIsInBvcCJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7O0FBRUFBLE9BQU9DLE9BQVAsR0FBaUI7QUFDZkMsUUFBTTtBQUNKQyxVQUFNO0FBQ0pDLFdBQUssdUJBQVEsV0FBUjtBQURELEtBREY7O0FBS0pDLFlBQVEsQ0FDTjtBQUNFLGNBQVEsUUFEVjtBQUVFLG9CQUFjO0FBQ1oseUJBQWlCO0FBQ2YseUJBQ0UseUVBQ0EsdUJBSGE7QUFJZixrQkFBUSxTQUpPO0FBS2YscUJBQVc7QUFMSTtBQURMLE9BRmhCO0FBV0UsOEJBQXdCO0FBWDFCLEtBRE07QUFMSixHQURTOztBQXVCZkMsVUFBUSxTQUFTQyxh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O0FBQ2JzQixzQkFBTVYsUUFETztBQUViVyx5QkFBUzFDLFlBQVkrQixTQUFTUyxHQUFyQixFQUEwQkYsSUFBMUI7QUFGSSxlQUFmO0FBSUE7QUFDRDs7QUFFREEsaUJBQUtMLElBQUwsQ0FBVUYsU0FBU1MsR0FBVCxDQUFhckMsSUFBdkI7QUFDQWlDLG9CQUFRTCxTQUFTakIsS0FBakIsRUFBd0JTLFVBQVVYLEdBQVYsQ0FBY21CLFNBQVNTLEdBQVQsQ0FBYXJDLElBQTNCLEVBQWlDb0IsU0FBekQsRUFBb0VlLElBQXBFO0FBQ0FBLGlCQUFLSyxHQUFMO0FBQ0Q7QUFDRjs7QUFFRFAsZ0JBQVFGLEVBQVIsRUFBWXBDLFdBQVdjLEdBQVgsQ0FBZXVCLEtBQUtoQyxJQUFwQixDQUFaO0FBQ0Q7QUFoSkksS0FBUDtBQWtKRDtBQXhMYyxDQUFqQiIsImZpbGUiOiJydWxlcy9uYW1lc3BhY2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZGVjbGFyZWRTY29wZSBmcm9tICdlc2xpbnQtbW9kdWxlLXV0aWxzL2RlY2xhcmVkU2NvcGUnXG5pbXBvcnQgRXhwb3J0cyBmcm9tICcuLi9FeHBvcnRNYXAnXG5pbXBvcnQgaW1wb3J0RGVjbGFyYXRpb24gZnJvbSAnLi4vaW1wb3J0RGVjbGFyYXRpb24nXG5pbXBvcnQgZG9jc1VybCBmcm9tICcuLi9kb2NzVXJsJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgbWV0YToge1xuICAgIGRvY3M6IHtcbiAgICAgIHVybDogZG9jc1VybCgnbmFtZXNwYWNlJyksXG4gICAgfSxcblxuICAgIHNjaGVtYTogW1xuICAgICAge1xuICAgICAgICAndHlwZSc6ICdvYmplY3QnLFxuICAgICAgICAncHJvcGVydGllcyc6IHtcbiAgICAgICAgICAnYWxsb3dDb21wdXRlZCc6IHtcbiAgICAgICAgICAgICdkZXNjcmlwdGlvbic6XG4gICAgICAgICAgICAgICdJZiBgZmFsc2VgLCB3aWxsIHJlcG9ydCBjb21wdXRlZCAoYW5kIHRodXMsIHVuLWxpbnRhYmxlKSByZWZlcmVuY2VzICcgK1xuICAgICAgICAgICAgICAndG8gbmFtZXNwYWNlIG1lbWJlcnMuJyxcbiAgICAgICAgICAgICd0eXBlJzogJ2Jvb2xlYW4nLFxuICAgICAgICAgICAgJ2RlZmF1bHQnOiBmYWxzZSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICAnYWRkaXRpb25hbFByb3BlcnRpZXMnOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgXSxcbiAgfSxcblxuICBjcmVhdGU6IGZ1bmN0aW9uIG5hbWVzcGFjZVJ1bGUoY29udGV4dCkge1xuXG4gICAgLy8gcmVhZCBvcHRpb25zXG4gICAgY29uc3Qge1xuICAgICAgYWxsb3dDb21wdXRlZCA9IGZhbHNlLFxuICAgIH0gPSBjb250ZXh0Lm9wdGlvbnNbMF0gfHwge31cblxuICAgIGNvbnN0IG5hbWVzcGFjZXMgPSBuZXcgTWFwKClcblxuICAgIGZ1bmN0aW9uIG1ha2VNZXNzYWdlKGxhc3QsIG5hbWVwYXRoKSB7XG4gICAgICAgcmV0dXJuIGAnJHtsYXN0Lm5hbWV9JyBub3QgZm91bmQgaW5gICtcbiAgICAgICAgICAgICAgKG5hbWVwYXRoLmxlbmd0aCA+IDEgPyAnIGRlZXBseSAnIDogJyAnKSArXG4gICAgICAgICAgICAgIGBpbXBvcnRlZCBuYW1lc3BhY2UgJyR7bmFtZXBhdGguam9pbignLicpfScuYFxuICAgIH1cblxuICAgIHJldHVybiB7XG5cbiAgICAgIC8vIHBpY2sgdXAgYWxsIGltcG9ydHMgYXQgYm9keSBlbnRyeSB0aW1lLCB0byBwcm9wZXJseSByZXNwZWN0IGhvaXN0aW5nXG4gICAgICAnUHJvZ3JhbSc6IGZ1bmN0aW9uICh7IGJvZHkgfSkge1xuICAgICAgICBmdW5jdGlvbiBwcm9jZXNzQm9keVN0YXRlbWVudChkZWNsYXJhdGlvbikge1xuICAgICAgICAgIGlmIChkZWNsYXJhdGlvbi50eXBlICE9PSAnSW1wb3J0RGVjbGFyYXRpb24nKSByZXR1cm5cblxuICAgICAgICAgIGlmIChkZWNsYXJhdGlvbi5zcGVjaWZpZXJzLmxlbmd0aCA9PT0gMCkgcmV0dXJuXG5cbiAgICAgICAgICBjb25zdCBpbXBvcnRzID0gRXhwb3J0cy5nZXQoZGVjbGFyYXRpb24uc291cmNlLnZhbHVlLCBjb250ZXh0KVxuICAgICAgICAgIGlmIChpbXBvcnRzID09IG51bGwpIHJldHVybiBudWxsXG5cbiAgICAgICAgICBpZiAoaW1wb3J0cy5lcnJvcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICBpbXBvcnRzLnJlcG9ydEVycm9ycyhjb250ZXh0LCBkZWNsYXJhdGlvbilcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIH1cblxuICAgICAgICAgIGZvciAobGV0IHNwZWNpZmllciBvZiBkZWNsYXJhdGlvbi5zcGVjaWZpZXJzKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKHNwZWNpZmllci50eXBlKSB7XG4gICAgICAgICAgICAgIGNhc2UgJ0ltcG9ydE5hbWVzcGFjZVNwZWNpZmllcic6XG4gICAgICAgICAgICAgICAgaWYgKCFpbXBvcnRzLnNpemUpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnRleHQucmVwb3J0KHNwZWNpZmllcixcbiAgICAgICAgICAgICAgICAgICAgYE5vIGV4cG9ydGVkIG5hbWVzIGZvdW5kIGluIG1vZHVsZSAnJHtkZWNsYXJhdGlvbi5zb3VyY2UudmFsdWV9Jy5gKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBuYW1lc3BhY2VzLnNldChzcGVjaWZpZXIubG9jYWwubmFtZSwgaW1wb3J0cylcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICBjYXNlICdJbXBvcnREZWZhdWx0U3BlY2lmaWVyJzpcbiAgICAgICAgICAgICAgY2FzZSAnSW1wb3J0U3BlY2lmaWVyJzoge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1ldGEgPSBpbXBvcnRzLmdldChcbiAgICAgICAgICAgICAgICAgIC8vIGRlZmF1bHQgdG8gJ2RlZmF1bHQnIGZvciBkZWZhdWx0IGh0dHA6Ly9pLmltZ3VyLmNvbS9uajZxQVd5LmpwZ1xuICAgICAgICAgICAgICAgICAgc3BlY2lmaWVyLmltcG9ydGVkID8gc3BlY2lmaWVyLmltcG9ydGVkLm5hbWUgOiAnZGVmYXVsdCcpXG4gICAgICAgICAgICAgICAgaWYgKCFtZXRhIHx8ICFtZXRhLm5hbWVzcGFjZSkgYnJlYWtcbiAgICAgICAgICAgICAgICBuYW1lc3BhY2VzLnNldChzcGVjaWZpZXIubG9jYWwubmFtZSwgbWV0YS5uYW1lc3BhY2UpXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBib2R5LmZvckVhY2gocHJvY2Vzc0JvZHlTdGF0ZW1lbnQpXG4gICAgICB9LFxuXG4gICAgICAvLyBzYW1lIGFzIGFib3ZlLCBidXQgZG9lcyBub3QgYWRkIG5hbWVzIHRvIGxvY2FsIG1hcFxuICAgICAgJ0V4cG9ydE5hbWVzcGFjZVNwZWNpZmllcic6IGZ1bmN0aW9uIChuYW1lc3BhY2UpIHtcbiAgICAgICAgdmFyIGRlY2xhcmF0aW9uID0gaW1wb3J0RGVjbGFyYXRpb24oY29udGV4dClcblxuICAgICAgICB2YXIgaW1wb3J0cyA9IEV4cG9ydHMuZ2V0KGRlY2xhcmF0aW9uLnNvdXJjZS52YWx1ZSwgY29udGV4dClcbiAgICAgICAgaWYgKGltcG9ydHMgPT0gbnVsbCkgcmV0dXJuIG51bGxcblxuICAgICAgICBpZiAoaW1wb3J0cy5lcnJvcnMubGVuZ3RoKSB7XG4gICAgICAgICAgaW1wb3J0cy5yZXBvcnRFcnJvcnMoY29udGV4dCwgZGVjbGFyYXRpb24pXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWltcG9ydHMuc2l6ZSkge1xuICAgICAgICAgIGNvbnRleHQucmVwb3J0KG5hbWVzcGFjZSxcbiAgICAgICAgICAgIGBObyBleHBvcnRlZCBuYW1lcyBmb3VuZCBpbiBtb2R1bGUgJyR7ZGVjbGFyYXRpb24uc291cmNlLnZhbHVlfScuYClcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgLy8gdG9kbzogY2hlY2sgZm9yIHBvc3NpYmxlIHJlZGVmaW5pdGlvblxuXG4gICAgICAnTWVtYmVyRXhwcmVzc2lvbic6IGZ1bmN0aW9uIChkZXJlZmVyZW5jZSkge1xuICAgICAgICBpZiAoZGVyZWZlcmVuY2Uub2JqZWN0LnR5cGUgIT09ICdJZGVudGlmaWVyJykgcmV0dXJuXG4gICAgICAgIGlmICghbmFtZXNwYWNlcy5oYXMoZGVyZWZlcmVuY2Uub2JqZWN0Lm5hbWUpKSByZXR1cm5cblxuICAgICAgICBpZiAoZGVyZWZlcmVuY2UucGFyZW50LnR5cGUgPT09ICdBc3NpZ25tZW50RXhwcmVzc2lvbicgJiZcbiAgICAgICAgICAgIGRlcmVmZXJlbmNlLnBhcmVudC5sZWZ0ID09PSBkZXJlZmVyZW5jZSkge1xuICAgICAgICAgICAgY29udGV4dC5yZXBvcnQoZGVyZWZlcmVuY2UucGFyZW50LFxuICAgICAgICAgICAgICAgIGBBc3NpZ25tZW50IHRvIG1lbWJlciBvZiBuYW1lc3BhY2UgJyR7ZGVyZWZlcmVuY2Uub2JqZWN0Lm5hbWV9Jy5gKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gZ28gZGVlcFxuICAgICAgICB2YXIgbmFtZXNwYWNlID0gbmFtZXNwYWNlcy5nZXQoZGVyZWZlcmVuY2Uub2JqZWN0Lm5hbWUpXG4gICAgICAgIHZhciBuYW1lcGF0aCA9IFtkZXJlZmVyZW5jZS5vYmplY3QubmFtZV1cbiAgICAgICAgLy8gd2hpbGUgcHJvcGVydHkgaXMgbmFtZXNwYWNlIGFuZCBwYXJlbnQgaXMgbWVtYmVyIGV4cHJlc3Npb24sIGtlZXAgdmFsaWRhdGluZ1xuICAgICAgICB3aGlsZSAobmFtZXNwYWNlIGluc3RhbmNlb2YgRXhwb3J0cyAmJlxuICAgICAgICAgICAgICAgZGVyZWZlcmVuY2UudHlwZSA9PT0gJ01lbWJlckV4cHJlc3Npb24nKSB7XG5cbiAgICAgICAgICBpZiAoZGVyZWZlcmVuY2UuY29tcHV0ZWQpIHtcbiAgICAgICAgICAgIGlmICghYWxsb3dDb21wdXRlZCkge1xuICAgICAgICAgICAgICBjb250ZXh0LnJlcG9ydChkZXJlZmVyZW5jZS5wcm9wZXJ0eSxcbiAgICAgICAgICAgICAgICAnVW5hYmxlIHRvIHZhbGlkYXRlIGNvbXB1dGVkIHJlZmVyZW5jZSB0byBpbXBvcnRlZCBuYW1lc3BhY2UgXFwnJyArXG4gICAgICAgICAgICAgICAgZGVyZWZlcmVuY2Uub2JqZWN0Lm5hbWUgKyAnXFwnLicpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIW5hbWVzcGFjZS5oYXMoZGVyZWZlcmVuY2UucHJvcGVydHkubmFtZSkpIHtcbiAgICAgICAgICAgIGNvbnRleHQucmVwb3J0KFxuICAgICAgICAgICAgICBkZXJlZmVyZW5jZS5wcm9wZXJ0eSxcbiAgICAgICAgICAgICAgbWFrZU1lc3NhZ2UoZGVyZWZlcmVuY2UucHJvcGVydHksIG5hbWVwYXRoKSlcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgZXhwb3J0ZWQgPSBuYW1lc3BhY2UuZ2V0KGRlcmVmZXJlbmNlLnByb3BlcnR5Lm5hbWUpXG4gICAgICAgICAgaWYgKGV4cG9ydGVkID09IG51bGwpIHJldHVyblxuXG4gICAgICAgICAgLy8gc3Rhc2ggYW5kIHBvcFxuICAgICAgICAgIG5hbWVwYXRoLnB1c2goZGVyZWZlcmVuY2UucHJvcGVydHkubmFtZSlcbiAgICAgICAgICBuYW1lc3BhY2UgPSBleHBvcnRlZC5uYW1lc3BhY2VcbiAgICAgICAgICBkZXJlZmVyZW5jZSA9IGRlcmVmZXJlbmNlLnBhcmVudFxuICAgICAgICB9XG5cbiAgICAgIH0sXG5cbiAgICAgICdWYXJpYWJsZURlY2xhcmF0b3InOiBmdW5jdGlvbiAoeyBpZCwgaW5pdCB9KSB7XG4gICAgICAgIGlmIChpbml0ID09IG51bGwpIHJldHVyblxuICAgICAgICBpZiAoaW5pdC50eXBlICE9PSAnSWRlbnRpZmllcicpIHJldHVyblxuICAgICAgICBpZiAoIW5hbWVzcGFjZXMuaGFzKGluaXQubmFtZSkpIHJldHVyblxuXG4gICAgICAgIC8vIGNoZWNrIGZvciByZWRlZmluaXRpb24gaW4gaW50ZXJtZWRpYXRlIHNjb3Blc1xuICAgICAgICBpZiAoZGVjbGFyZWRTY29wZShjb250ZXh0LCBpbml0Lm5hbWUpICE9PSAnbW9kdWxlJykgcmV0dXJuXG5cbiAgICAgICAgLy8gREZTIHRyYXZlcnNlIGNoaWxkIG5hbWVzcGFjZXNcbiAgICAgICAgZnVuY3Rpb24gdGVzdEtleShwYXR0ZXJuLCBuYW1lc3BhY2UsIHBhdGggPSBbaW5pdC5uYW1lXSkge1xuICAgICAgICAgIGlmICghKG5hbWVzcGFjZSBpbnN0YW5jZW9mIEV4cG9ydHMpKSByZXR1cm5cblxuICAgICAgICAgIGlmIChwYXR0ZXJuLnR5cGUgIT09ICdPYmplY3RQYXR0ZXJuJykgcmV0dXJuXG5cbiAgICAgICAgICBmb3IgKGxldCBwcm9wZXJ0eSBvZiBwYXR0ZXJuLnByb3BlcnRpZXMpIHtcblxuICAgICAgICAgICAgaWYgKHByb3BlcnR5LmtleS50eXBlICE9PSAnSWRlbnRpZmllcicpIHtcbiAgICAgICAgICAgICAgY29udGV4dC5yZXBvcnQoe1xuICAgICAgICAgICAgICAgIG5vZGU6IHByb3BlcnR5LFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdPbmx5IGRlc3RydWN0dXJlIHRvcC1sZXZlbCBuYW1lcy4nLFxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIW5hbWVzcGFjZS5oYXMocHJvcGVydHkua2V5Lm5hbWUpKSB7XG4gICAgICAgICAgICAgIGNvbnRleHQucmVwb3J0KHtcbiAgICAgICAgICAgICAgICBub2RlOiBwcm9wZXJ0eSxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBtYWtlTWVzc2FnZShwcm9wZXJ0eS5rZXksIHBhdGgpLFxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwYXRoLnB1c2gocHJvcGVydHkua2V5Lm5hbWUpXG4gICAgICAgICAgICB0ZXN0S2V5KHByb3BlcnR5LnZhbHVlLCBuYW1lc3BhY2UuZ2V0KHByb3BlcnR5LmtleS5uYW1lKS5uYW1lc3BhY2UsIHBhdGgpXG4gICAgICAgICAgICBwYXRoLnBvcCgpXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGVzdEtleShpZCwgbmFtZXNwYWNlcy5nZXQoaW5pdC5uYW1lKSlcbiAgICAgIH0sXG4gICAgfVxuICB9LFxufVxuIl19