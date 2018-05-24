'use strict';

var _docsUrl = require('../docsUrl');

var _docsUrl2 = _interopRequireDefault(_docsUrl);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const defs = {
  ArrayExpression: {
    option: 'allowArray',
    description: 'If `false`, will report default export of an array',
    message: 'Assign array to a variable before exporting as module default'
  },
  ArrowFunctionExpression: {
    option: 'allowArrowFunction',
    description: 'If `false`, will report default export of an arrow function',
    message: 'Assign arrow function to a variable before exporting as module default'
  },
  CallExpression: {
    option: 'allowCallExpression',
    description: 'If `false`, will report default export of a function call',
    message: 'Assign call result to a variable before exporting as module default',
    default: true
  },
  ClassDeclaration: {
    option: 'allowAnonymousClass',
    description: 'If `false`, will report default export of an anonymous class',
    message: 'Unexpected default export of anonymous class',
    forbid: node => !node.declaration.id
  },
  FunctionDeclaration: {
    option: 'allowAnonymousFunction',
    description: 'If `false`, will report default export of an anonymous function',
    message: 'Unexpected default export of anonymous function',
    forbid: node => !node.declaration.id
  },
  Literal: {
    option: 'allowLiteral',
    description: 'If `false`, will report default export of a literal',
    message: 'Assign literal to a variable before exporting as module default'
  },
  ObjectExpression: {
    option: 'allowObject',
    description: 'If `false`, will report default export of an object expression',
    message: 'Assign object to a variable before exporting as module default'
  },
  TemplateLiteral: {
    option: 'allowLiteral',
    description: 'If `false`, will report default export of a literal',
    message: 'Assign literal to a variable before exporting as module default'
  }
}; /**
    * @fileoverview Rule to disallow anonymous default exports.
    * @author Duncan Beevers
    */

const schemaProperties = Object.keys(defs).map(key => defs[key]).reduce((acc, def) => {
  acc[def.option] = {
    description: def.description,
    type: 'boolean'
  };

  return acc;
}, {});

const defaults = Object.keys(defs).map(key => defs[key]).reduce((acc, def) => {
  acc[def.option] = def.hasOwnProperty('default') ? def.default : false;
  return acc;
}, {});

module.exports = {
  meta: {
    docs: {
      url: (0, _docsUrl2.default)('no-anonymous-default-export')
    },

    schema: [{
      type: 'object',
      properties: schemaProperties,
      'additionalProperties': false
    }]
  },

  create: function (context) {
    const options = Object.assign({}, defaults, context.options[0]);

    return {
      'ExportDefaultDeclaration': node => {
        const def = defs[node.declaration.type];

        // Recognized node type and allowed by configuration,
        //   and has no forbid check, or forbid check return value is truthy
        if (def && !options[def.option] && (!def.forbid || def.forbid(node))) {
          context.report({ node, message: def.message });
        }
      }
    };
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzL25vLWFub255bW91cy1kZWZhdWx0LWV4cG9ydC5qcyJdLCJuYW1lcyI6WyJkZWZzIiwiQXJyYXlFeHByZXNzaW9uIiwib3B0aW9uIiwiZGVzY3JpcHRpb24iLCJtZXNzYWdlIiwiQXJyb3dGdW5jdGlvbkV4cHJlc3Npb24iLCJDYWxsRXhwcmVzc2lvbiIsImRlZmF1bHQiLCJDbGFzc0RlY2xhcmF0aW9uIiwiZm9yYmlkIiwibm9kZSIsImRlY2xhcmF0aW9uIiwiaWQiLCJGdW5jdGlvbkRlY2xhcmF0aW9uIiwiTGl0ZXJhbCIsIk9iamVjdEV4cHJlc3Npb24iLCJUZW1wbGF0ZUxpdGVyYWwiLCJzY2hlbWFQcm9wZXJ0aWVzIiwiT2JqZWN0Iiwia2V5cyIsIm1hcCIsImtleSIsInJlZHVjZSIsImFjYyIsImRlZiIsInR5cGUiLCJkZWZhdWx0cyIsImhhc093blByb3BlcnR5IiwibW9kdWxlIiwiZXhwb3J0cyIsIm1ldGEiLCJkb2NzIiwidXJsIiwic2NoZW1hIiwicHJvcGVydGllcyIsImNyZWF0ZSIsImNvbnRleHQiLCJvcHRpb25zIiwiYXNzaWduIiwicmVwb3J0Il0sIm1hcHBpbmdzIjoiOztBQUtBOzs7Ozs7QUFFQSxNQUFNQSxPQUFPO0FBQ1hDLG1CQUFpQjtBQUNmQyxZQUFRLFlBRE87QUFFZkMsaUJBQWEsb0RBRkU7QUFHZkMsYUFBUztBQUhNLEdBRE47QUFNWEMsMkJBQXlCO0FBQ3ZCSCxZQUFRLG9CQURlO0FBRXZCQyxpQkFBYSw2REFGVTtBQUd2QkMsYUFBUztBQUhjLEdBTmQ7QUFXWEUsa0JBQWdCO0FBQ2RKLFlBQVEscUJBRE07QUFFZEMsaUJBQWEsMkRBRkM7QUFHZEMsYUFBUyxxRUFISztBQUlkRyxhQUFTO0FBSkssR0FYTDtBQWlCWEMsb0JBQWtCO0FBQ2hCTixZQUFRLHFCQURRO0FBRWhCQyxpQkFBYSw4REFGRztBQUdoQkMsYUFBUyw4Q0FITztBQUloQkssWUFBU0MsSUFBRCxJQUFVLENBQUNBLEtBQUtDLFdBQUwsQ0FBaUJDO0FBSnBCLEdBakJQO0FBdUJYQyx1QkFBcUI7QUFDbkJYLFlBQVEsd0JBRFc7QUFFbkJDLGlCQUFhLGlFQUZNO0FBR25CQyxhQUFTLGlEQUhVO0FBSW5CSyxZQUFTQyxJQUFELElBQVUsQ0FBQ0EsS0FBS0MsV0FBTCxDQUFpQkM7QUFKakIsR0F2QlY7QUE2QlhFLFdBQVM7QUFDUFosWUFBUSxjQUREO0FBRVBDLGlCQUFhLHFEQUZOO0FBR1BDLGFBQVM7QUFIRixHQTdCRTtBQWtDWFcsb0JBQWtCO0FBQ2hCYixZQUFRLGFBRFE7QUFFaEJDLGlCQUFhLGdFQUZHO0FBR2hCQyxhQUFTO0FBSE8sR0FsQ1A7QUF1Q1hZLG1CQUFpQjtBQUNmZCxZQUFRLGNBRE87QUFFZkMsaUJBQWEscURBRkU7QUFHZkMsYUFBUztBQUhNO0FBdkNOLENBQWIsQyxDQVBBOzs7OztBQXFEQSxNQUFNYSxtQkFBbUJDLE9BQU9DLElBQVAsQ0FBWW5CLElBQVosRUFDdEJvQixHQURzQixDQUNqQkMsR0FBRCxJQUFTckIsS0FBS3FCLEdBQUwsQ0FEUyxFQUV0QkMsTUFGc0IsQ0FFZixDQUFDQyxHQUFELEVBQU1DLEdBQU4sS0FBYztBQUNwQkQsTUFBSUMsSUFBSXRCLE1BQVIsSUFBa0I7QUFDaEJDLGlCQUFhcUIsSUFBSXJCLFdBREQ7QUFFaEJzQixVQUFNO0FBRlUsR0FBbEI7O0FBS0EsU0FBT0YsR0FBUDtBQUNELENBVHNCLEVBU3BCLEVBVG9CLENBQXpCOztBQVdBLE1BQU1HLFdBQVdSLE9BQU9DLElBQVAsQ0FBWW5CLElBQVosRUFDZG9CLEdBRGMsQ0FDVEMsR0FBRCxJQUFTckIsS0FBS3FCLEdBQUwsQ0FEQyxFQUVkQyxNQUZjLENBRVAsQ0FBQ0MsR0FBRCxFQUFNQyxHQUFOLEtBQWM7QUFDcEJELE1BQUlDLElBQUl0QixNQUFSLElBQWtCc0IsSUFBSUcsY0FBSixDQUFtQixTQUFuQixJQUFnQ0gsSUFBSWpCLE9BQXBDLEdBQThDLEtBQWhFO0FBQ0EsU0FBT2dCLEdBQVA7QUFDRCxDQUxjLEVBS1osRUFMWSxDQUFqQjs7QUFPQUssT0FBT0MsT0FBUCxHQUFpQjtBQUNmQyxRQUFNO0FBQ0pDLFVBQU07QUFDSkMsV0FBSyx1QkFBUSw2QkFBUjtBQURELEtBREY7O0FBS0pDLFlBQVEsQ0FDTjtBQUNFUixZQUFNLFFBRFI7QUFFRVMsa0JBQVlqQixnQkFGZDtBQUdFLDhCQUF3QjtBQUgxQixLQURNO0FBTEosR0FEUzs7QUFlZmtCLFVBQVEsVUFBVUMsT0FBVixFQUFtQjtBQUN6QixVQUFNQyxVQUFVbkIsT0FBT29CLE1BQVAsQ0FBYyxFQUFkLEVBQWtCWixRQUFsQixFQUE0QlUsUUFBUUMsT0FBUixDQUFnQixDQUFoQixDQUE1QixDQUFoQjs7QUFFQSxXQUFPO0FBQ0wsa0NBQTZCM0IsSUFBRCxJQUFVO0FBQ3BDLGNBQU1jLE1BQU14QixLQUFLVSxLQUFLQyxXQUFMLENBQWlCYyxJQUF0QixDQUFaOztBQUVBO0FBQ0E7QUFDQSxZQUFJRCxPQUFPLENBQUNhLFFBQVFiLElBQUl0QixNQUFaLENBQVIsS0FBZ0MsQ0FBQ3NCLElBQUlmLE1BQUwsSUFBZWUsSUFBSWYsTUFBSixDQUFXQyxJQUFYLENBQS9DLENBQUosRUFBc0U7QUFDcEUwQixrQkFBUUcsTUFBUixDQUFlLEVBQUU3QixJQUFGLEVBQVFOLFNBQVNvQixJQUFJcEIsT0FBckIsRUFBZjtBQUNEO0FBQ0Y7QUFUSSxLQUFQO0FBV0Q7QUE3QmMsQ0FBakIiLCJmaWxlIjoicnVsZXMvbm8tYW5vbnltb3VzLWRlZmF1bHQtZXhwb3J0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFJ1bGUgdG8gZGlzYWxsb3cgYW5vbnltb3VzIGRlZmF1bHQgZXhwb3J0cy5cbiAqIEBhdXRob3IgRHVuY2FuIEJlZXZlcnNcbiAqL1xuXG5pbXBvcnQgZG9jc1VybCBmcm9tICcuLi9kb2NzVXJsJ1xuXG5jb25zdCBkZWZzID0ge1xuICBBcnJheUV4cHJlc3Npb246IHtcbiAgICBvcHRpb246ICdhbGxvd0FycmF5JyxcbiAgICBkZXNjcmlwdGlvbjogJ0lmIGBmYWxzZWAsIHdpbGwgcmVwb3J0IGRlZmF1bHQgZXhwb3J0IG9mIGFuIGFycmF5JyxcbiAgICBtZXNzYWdlOiAnQXNzaWduIGFycmF5IHRvIGEgdmFyaWFibGUgYmVmb3JlIGV4cG9ydGluZyBhcyBtb2R1bGUgZGVmYXVsdCcsXG4gIH0sXG4gIEFycm93RnVuY3Rpb25FeHByZXNzaW9uOiB7XG4gICAgb3B0aW9uOiAnYWxsb3dBcnJvd0Z1bmN0aW9uJyxcbiAgICBkZXNjcmlwdGlvbjogJ0lmIGBmYWxzZWAsIHdpbGwgcmVwb3J0IGRlZmF1bHQgZXhwb3J0IG9mIGFuIGFycm93IGZ1bmN0aW9uJyxcbiAgICBtZXNzYWdlOiAnQXNzaWduIGFycm93IGZ1bmN0aW9uIHRvIGEgdmFyaWFibGUgYmVmb3JlIGV4cG9ydGluZyBhcyBtb2R1bGUgZGVmYXVsdCcsXG4gIH0sXG4gIENhbGxFeHByZXNzaW9uOiB7XG4gICAgb3B0aW9uOiAnYWxsb3dDYWxsRXhwcmVzc2lvbicsXG4gICAgZGVzY3JpcHRpb246ICdJZiBgZmFsc2VgLCB3aWxsIHJlcG9ydCBkZWZhdWx0IGV4cG9ydCBvZiBhIGZ1bmN0aW9uIGNhbGwnLFxuICAgIG1lc3NhZ2U6ICdBc3NpZ24gY2FsbCByZXN1bHQgdG8gYSB2YXJpYWJsZSBiZWZvcmUgZXhwb3J0aW5nIGFzIG1vZHVsZSBkZWZhdWx0JyxcbiAgICBkZWZhdWx0OiB0cnVlLFxuICB9LFxuICBDbGFzc0RlY2xhcmF0aW9uOiB7XG4gICAgb3B0aW9uOiAnYWxsb3dBbm9ueW1vdXNDbGFzcycsXG4gICAgZGVzY3JpcHRpb246ICdJZiBgZmFsc2VgLCB3aWxsIHJlcG9ydCBkZWZhdWx0IGV4cG9ydCBvZiBhbiBhbm9ueW1vdXMgY2xhc3MnLFxuICAgIG1lc3NhZ2U6ICdVbmV4cGVjdGVkIGRlZmF1bHQgZXhwb3J0IG9mIGFub255bW91cyBjbGFzcycsXG4gICAgZm9yYmlkOiAobm9kZSkgPT4gIW5vZGUuZGVjbGFyYXRpb24uaWQsXG4gIH0sXG4gIEZ1bmN0aW9uRGVjbGFyYXRpb246IHtcbiAgICBvcHRpb246ICdhbGxvd0Fub255bW91c0Z1bmN0aW9uJyxcbiAgICBkZXNjcmlwdGlvbjogJ0lmIGBmYWxzZWAsIHdpbGwgcmVwb3J0IGRlZmF1bHQgZXhwb3J0IG9mIGFuIGFub255bW91cyBmdW5jdGlvbicsXG4gICAgbWVzc2FnZTogJ1VuZXhwZWN0ZWQgZGVmYXVsdCBleHBvcnQgb2YgYW5vbnltb3VzIGZ1bmN0aW9uJyxcbiAgICBmb3JiaWQ6IChub2RlKSA9PiAhbm9kZS5kZWNsYXJhdGlvbi5pZCxcbiAgfSxcbiAgTGl0ZXJhbDoge1xuICAgIG9wdGlvbjogJ2FsbG93TGl0ZXJhbCcsXG4gICAgZGVzY3JpcHRpb246ICdJZiBgZmFsc2VgLCB3aWxsIHJlcG9ydCBkZWZhdWx0IGV4cG9ydCBvZiBhIGxpdGVyYWwnLFxuICAgIG1lc3NhZ2U6ICdBc3NpZ24gbGl0ZXJhbCB0byBhIHZhcmlhYmxlIGJlZm9yZSBleHBvcnRpbmcgYXMgbW9kdWxlIGRlZmF1bHQnLFxuICB9LFxuICBPYmplY3RFeHByZXNzaW9uOiB7XG4gICAgb3B0aW9uOiAnYWxsb3dPYmplY3QnLFxuICAgIGRlc2NyaXB0aW9uOiAnSWYgYGZhbHNlYCwgd2lsbCByZXBvcnQgZGVmYXVsdCBleHBvcnQgb2YgYW4gb2JqZWN0IGV4cHJlc3Npb24nLFxuICAgIG1lc3NhZ2U6ICdBc3NpZ24gb2JqZWN0IHRvIGEgdmFyaWFibGUgYmVmb3JlIGV4cG9ydGluZyBhcyBtb2R1bGUgZGVmYXVsdCcsXG4gIH0sXG4gIFRlbXBsYXRlTGl0ZXJhbDoge1xuICAgIG9wdGlvbjogJ2FsbG93TGl0ZXJhbCcsXG4gICAgZGVzY3JpcHRpb246ICdJZiBgZmFsc2VgLCB3aWxsIHJlcG9ydCBkZWZhdWx0IGV4cG9ydCBvZiBhIGxpdGVyYWwnLFxuICAgIG1lc3NhZ2U6ICdBc3NpZ24gbGl0ZXJhbCB0byBhIHZhcmlhYmxlIGJlZm9yZSBleHBvcnRpbmcgYXMgbW9kdWxlIGRlZmF1bHQnLFxuICB9LFxufVxuXG5jb25zdCBzY2hlbWFQcm9wZXJ0aWVzID0gT2JqZWN0LmtleXMoZGVmcylcbiAgLm1hcCgoa2V5KSA9PiBkZWZzW2tleV0pXG4gIC5yZWR1Y2UoKGFjYywgZGVmKSA9PiB7XG4gICAgYWNjW2RlZi5vcHRpb25dID0ge1xuICAgICAgZGVzY3JpcHRpb246IGRlZi5kZXNjcmlwdGlvbixcbiAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICB9XG5cbiAgICByZXR1cm4gYWNjXG4gIH0sIHt9KVxuXG5jb25zdCBkZWZhdWx0cyA9IE9iamVjdC5rZXlzKGRlZnMpXG4gIC5tYXAoKGtleSkgPT4gZGVmc1trZXldKVxuICAucmVkdWNlKChhY2MsIGRlZikgPT4ge1xuICAgIGFjY1tkZWYub3B0aW9uXSA9IGRlZi5oYXNPd25Qcm9wZXJ0eSgnZGVmYXVsdCcpID8gZGVmLmRlZmF1bHQgOiBmYWxzZVxuICAgIHJldHVybiBhY2NcbiAgfSwge30pXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBtZXRhOiB7XG4gICAgZG9jczoge1xuICAgICAgdXJsOiBkb2NzVXJsKCduby1hbm9ueW1vdXMtZGVmYXVsdC1leHBvcnQnKSxcbiAgICB9LFxuXG4gICAgc2NoZW1hOiBbXG4gICAgICB7XG4gICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICBwcm9wZXJ0aWVzOiBzY2hlbWFQcm9wZXJ0aWVzLFxuICAgICAgICAnYWRkaXRpb25hbFByb3BlcnRpZXMnOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgXSxcbiAgfSxcblxuICBjcmVhdGU6IGZ1bmN0aW9uIChjb250ZXh0KSB7XG4gICAgY29uc3Qgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRzLCBjb250ZXh0Lm9wdGlvbnNbMF0pXG5cbiAgICByZXR1cm4ge1xuICAgICAgJ0V4cG9ydERlZmF1bHREZWNsYXJhdGlvbic6IChub2RlKSA9PiB7XG4gICAgICAgIGNvbnN0IGRlZiA9IGRlZnNbbm9kZS5kZWNsYXJhdGlvbi50eXBlXVxuXG4gICAgICAgIC8vIFJlY29nbml6ZWQgbm9kZSB0eXBlIGFuZCBhbGxvd2VkIGJ5IGNvbmZpZ3VyYXRpb24sXG4gICAgICAgIC8vICAgYW5kIGhhcyBubyBmb3JiaWQgY2hlY2ssIG9yIGZvcmJpZCBjaGVjayByZXR1cm4gdmFsdWUgaXMgdHJ1dGh5XG4gICAgICAgIGlmIChkZWYgJiYgIW9wdGlvbnNbZGVmLm9wdGlvbl0gJiYgKCFkZWYuZm9yYmlkIHx8IGRlZi5mb3JiaWQobm9kZSkpKSB7XG4gICAgICAgICAgY29udGV4dC5yZXBvcnQoeyBub2RlLCBtZXNzYWdlOiBkZWYubWVzc2FnZSB9KVxuICAgICAgICB9XG4gICAgICB9LFxuICAgIH1cbiAgfSxcbn1cbiJdfQ==