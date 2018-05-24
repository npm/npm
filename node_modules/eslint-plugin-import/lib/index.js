'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
const rules = exports.rules = {
  'no-unresolved': require('./rules/no-unresolved'),
  'named': require('./rules/named'),
  'default': require('./rules/default'),
  'namespace': require('./rules/namespace'),
  'no-namespace': require('./rules/no-namespace'),
  'export': require('./rules/export'),
  'no-mutable-exports': require('./rules/no-mutable-exports'),
  'extensions': require('./rules/extensions'),
  'no-restricted-paths': require('./rules/no-restricted-paths'),
  'no-internal-modules': require('./rules/no-internal-modules'),
  'group-exports': require('./rules/group-exports'),

  'no-self-import': require('./rules/no-self-import'),
  'no-named-default': require('./rules/no-named-default'),
  'no-named-as-default': require('./rules/no-named-as-default'),
  'no-named-as-default-member': require('./rules/no-named-as-default-member'),
  'no-anonymous-default-export': require('./rules/no-anonymous-default-export'),

  'no-commonjs': require('./rules/no-commonjs'),
  'no-amd': require('./rules/no-amd'),
  'no-duplicates': require('./rules/no-duplicates'),
  'first': require('./rules/first'),
  'max-dependencies': require('./rules/max-dependencies'),
  'no-extraneous-dependencies': require('./rules/no-extraneous-dependencies'),
  'no-absolute-path': require('./rules/no-absolute-path'),
  'no-nodejs-modules': require('./rules/no-nodejs-modules'),
  'no-webpack-loader-syntax': require('./rules/no-webpack-loader-syntax'),
  'order': require('./rules/order'),
  'newline-after-import': require('./rules/newline-after-import'),
  'prefer-default-export': require('./rules/prefer-default-export'),
  'no-default-export': require('./rules/no-default-export'),
  'no-dynamic-require': require('./rules/no-dynamic-require'),
  'unambiguous': require('./rules/unambiguous'),
  'no-unassigned-import': require('./rules/no-unassigned-import'),
  'no-useless-path-segments': require('./rules/no-useless-path-segments'),

  // export
  'exports-last': require('./rules/exports-last'),

  // metadata-based
  'no-deprecated': require('./rules/no-deprecated'),

  // deprecated aliases to rules
  'imports-first': require('./rules/imports-first')
};

const configs = exports.configs = {
  'recommended': require('../config/recommended'),

  'errors': require('../config/errors'),
  'warnings': require('../config/warnings'),

  // shhhh... work in progress "secret" rules
  'stage-0': require('../config/stage-0'),

  // useful stuff for folks using various environments
  'react': require('../config/react'),
  'react-native': require('../config/react-native'),
  'electron': require('../config/electron')
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LmpzIl0sIm5hbWVzIjpbInJ1bGVzIiwicmVxdWlyZSIsImNvbmZpZ3MiXSwibWFwcGluZ3MiOiI7Ozs7O0FBQU8sTUFBTUEsd0JBQVE7QUFDbkIsbUJBQWlCQyxRQUFRLHVCQUFSLENBREU7QUFFbkIsV0FBU0EsUUFBUSxlQUFSLENBRlU7QUFHbkIsYUFBV0EsUUFBUSxpQkFBUixDQUhRO0FBSW5CLGVBQWFBLFFBQVEsbUJBQVIsQ0FKTTtBQUtuQixrQkFBZ0JBLFFBQVEsc0JBQVIsQ0FMRztBQU1uQixZQUFVQSxRQUFRLGdCQUFSLENBTlM7QUFPbkIsd0JBQXNCQSxRQUFRLDRCQUFSLENBUEg7QUFRbkIsZ0JBQWNBLFFBQVEsb0JBQVIsQ0FSSztBQVNuQix5QkFBdUJBLFFBQVEsNkJBQVIsQ0FUSjtBQVVuQix5QkFBdUJBLFFBQVEsNkJBQVIsQ0FWSjtBQVduQixtQkFBaUJBLFFBQVEsdUJBQVIsQ0FYRTs7QUFhbkIsb0JBQWtCQSxRQUFRLHdCQUFSLENBYkM7QUFjbkIsc0JBQW9CQSxRQUFRLDBCQUFSLENBZEQ7QUFlbkIseUJBQXVCQSxRQUFRLDZCQUFSLENBZko7QUFnQm5CLGdDQUE4QkEsUUFBUSxvQ0FBUixDQWhCWDtBQWlCbkIsaUNBQStCQSxRQUFRLHFDQUFSLENBakJaOztBQW1CbkIsaUJBQWVBLFFBQVEscUJBQVIsQ0FuQkk7QUFvQm5CLFlBQVVBLFFBQVEsZ0JBQVIsQ0FwQlM7QUFxQm5CLG1CQUFpQkEsUUFBUSx1QkFBUixDQXJCRTtBQXNCbkIsV0FBU0EsUUFBUSxlQUFSLENBdEJVO0FBdUJuQixzQkFBb0JBLFFBQVEsMEJBQVIsQ0F2QkQ7QUF3Qm5CLGdDQUE4QkEsUUFBUSxvQ0FBUixDQXhCWDtBQXlCbkIsc0JBQW9CQSxRQUFRLDBCQUFSLENBekJEO0FBMEJuQix1QkFBcUJBLFFBQVEsMkJBQVIsQ0ExQkY7QUEyQm5CLDhCQUE0QkEsUUFBUSxrQ0FBUixDQTNCVDtBQTRCbkIsV0FBU0EsUUFBUSxlQUFSLENBNUJVO0FBNkJuQiwwQkFBd0JBLFFBQVEsOEJBQVIsQ0E3Qkw7QUE4Qm5CLDJCQUF5QkEsUUFBUSwrQkFBUixDQTlCTjtBQStCbkIsdUJBQXFCQSxRQUFRLDJCQUFSLENBL0JGO0FBZ0NuQix3QkFBc0JBLFFBQVEsNEJBQVIsQ0FoQ0g7QUFpQ25CLGlCQUFlQSxRQUFRLHFCQUFSLENBakNJO0FBa0NuQiwwQkFBd0JBLFFBQVEsOEJBQVIsQ0FsQ0w7QUFtQ25CLDhCQUE0QkEsUUFBUSxrQ0FBUixDQW5DVDs7QUFxQ25CO0FBQ0Esa0JBQWdCQSxRQUFRLHNCQUFSLENBdENHOztBQXdDbkI7QUFDQSxtQkFBaUJBLFFBQVEsdUJBQVIsQ0F6Q0U7O0FBMkNuQjtBQUNBLG1CQUFpQkEsUUFBUSx1QkFBUjtBQTVDRSxDQUFkOztBQStDQSxNQUFNQyw0QkFBVTtBQUNyQixpQkFBZUQsUUFBUSx1QkFBUixDQURNOztBQUdyQixZQUFVQSxRQUFRLGtCQUFSLENBSFc7QUFJckIsY0FBWUEsUUFBUSxvQkFBUixDQUpTOztBQU1yQjtBQUNBLGFBQVdBLFFBQVEsbUJBQVIsQ0FQVTs7QUFTckI7QUFDQSxXQUFTQSxRQUFRLGlCQUFSLENBVlk7QUFXckIsa0JBQWdCQSxRQUFRLHdCQUFSLENBWEs7QUFZckIsY0FBWUEsUUFBUSxvQkFBUjtBQVpTLENBQWhCIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGNvbnN0IHJ1bGVzID0ge1xuICAnbm8tdW5yZXNvbHZlZCc6IHJlcXVpcmUoJy4vcnVsZXMvbm8tdW5yZXNvbHZlZCcpLFxuICAnbmFtZWQnOiByZXF1aXJlKCcuL3J1bGVzL25hbWVkJyksXG4gICdkZWZhdWx0JzogcmVxdWlyZSgnLi9ydWxlcy9kZWZhdWx0JyksXG4gICduYW1lc3BhY2UnOiByZXF1aXJlKCcuL3J1bGVzL25hbWVzcGFjZScpLFxuICAnbm8tbmFtZXNwYWNlJzogcmVxdWlyZSgnLi9ydWxlcy9uby1uYW1lc3BhY2UnKSxcbiAgJ2V4cG9ydCc6IHJlcXVpcmUoJy4vcnVsZXMvZXhwb3J0JyksXG4gICduby1tdXRhYmxlLWV4cG9ydHMnOiByZXF1aXJlKCcuL3J1bGVzL25vLW11dGFibGUtZXhwb3J0cycpLFxuICAnZXh0ZW5zaW9ucyc6IHJlcXVpcmUoJy4vcnVsZXMvZXh0ZW5zaW9ucycpLFxuICAnbm8tcmVzdHJpY3RlZC1wYXRocyc6IHJlcXVpcmUoJy4vcnVsZXMvbm8tcmVzdHJpY3RlZC1wYXRocycpLFxuICAnbm8taW50ZXJuYWwtbW9kdWxlcyc6IHJlcXVpcmUoJy4vcnVsZXMvbm8taW50ZXJuYWwtbW9kdWxlcycpLFxuICAnZ3JvdXAtZXhwb3J0cyc6IHJlcXVpcmUoJy4vcnVsZXMvZ3JvdXAtZXhwb3J0cycpLFxuXG4gICduby1zZWxmLWltcG9ydCc6IHJlcXVpcmUoJy4vcnVsZXMvbm8tc2VsZi1pbXBvcnQnKSxcbiAgJ25vLW5hbWVkLWRlZmF1bHQnOiByZXF1aXJlKCcuL3J1bGVzL25vLW5hbWVkLWRlZmF1bHQnKSxcbiAgJ25vLW5hbWVkLWFzLWRlZmF1bHQnOiByZXF1aXJlKCcuL3J1bGVzL25vLW5hbWVkLWFzLWRlZmF1bHQnKSxcbiAgJ25vLW5hbWVkLWFzLWRlZmF1bHQtbWVtYmVyJzogcmVxdWlyZSgnLi9ydWxlcy9uby1uYW1lZC1hcy1kZWZhdWx0LW1lbWJlcicpLFxuICAnbm8tYW5vbnltb3VzLWRlZmF1bHQtZXhwb3J0JzogcmVxdWlyZSgnLi9ydWxlcy9uby1hbm9ueW1vdXMtZGVmYXVsdC1leHBvcnQnKSxcblxuICAnbm8tY29tbW9uanMnOiByZXF1aXJlKCcuL3J1bGVzL25vLWNvbW1vbmpzJyksXG4gICduby1hbWQnOiByZXF1aXJlKCcuL3J1bGVzL25vLWFtZCcpLFxuICAnbm8tZHVwbGljYXRlcyc6IHJlcXVpcmUoJy4vcnVsZXMvbm8tZHVwbGljYXRlcycpLFxuICAnZmlyc3QnOiByZXF1aXJlKCcuL3J1bGVzL2ZpcnN0JyksXG4gICdtYXgtZGVwZW5kZW5jaWVzJzogcmVxdWlyZSgnLi9ydWxlcy9tYXgtZGVwZW5kZW5jaWVzJyksXG4gICduby1leHRyYW5lb3VzLWRlcGVuZGVuY2llcyc6IHJlcXVpcmUoJy4vcnVsZXMvbm8tZXh0cmFuZW91cy1kZXBlbmRlbmNpZXMnKSxcbiAgJ25vLWFic29sdXRlLXBhdGgnOiByZXF1aXJlKCcuL3J1bGVzL25vLWFic29sdXRlLXBhdGgnKSxcbiAgJ25vLW5vZGVqcy1tb2R1bGVzJzogcmVxdWlyZSgnLi9ydWxlcy9uby1ub2RlanMtbW9kdWxlcycpLFxuICAnbm8td2VicGFjay1sb2FkZXItc3ludGF4JzogcmVxdWlyZSgnLi9ydWxlcy9uby13ZWJwYWNrLWxvYWRlci1zeW50YXgnKSxcbiAgJ29yZGVyJzogcmVxdWlyZSgnLi9ydWxlcy9vcmRlcicpLFxuICAnbmV3bGluZS1hZnRlci1pbXBvcnQnOiByZXF1aXJlKCcuL3J1bGVzL25ld2xpbmUtYWZ0ZXItaW1wb3J0JyksXG4gICdwcmVmZXItZGVmYXVsdC1leHBvcnQnOiByZXF1aXJlKCcuL3J1bGVzL3ByZWZlci1kZWZhdWx0LWV4cG9ydCcpLFxuICAnbm8tZGVmYXVsdC1leHBvcnQnOiByZXF1aXJlKCcuL3J1bGVzL25vLWRlZmF1bHQtZXhwb3J0JyksXG4gICduby1keW5hbWljLXJlcXVpcmUnOiByZXF1aXJlKCcuL3J1bGVzL25vLWR5bmFtaWMtcmVxdWlyZScpLFxuICAndW5hbWJpZ3VvdXMnOiByZXF1aXJlKCcuL3J1bGVzL3VuYW1iaWd1b3VzJyksXG4gICduby11bmFzc2lnbmVkLWltcG9ydCc6IHJlcXVpcmUoJy4vcnVsZXMvbm8tdW5hc3NpZ25lZC1pbXBvcnQnKSxcbiAgJ25vLXVzZWxlc3MtcGF0aC1zZWdtZW50cyc6IHJlcXVpcmUoJy4vcnVsZXMvbm8tdXNlbGVzcy1wYXRoLXNlZ21lbnRzJyksXG5cbiAgLy8gZXhwb3J0XG4gICdleHBvcnRzLWxhc3QnOiByZXF1aXJlKCcuL3J1bGVzL2V4cG9ydHMtbGFzdCcpLFxuXG4gIC8vIG1ldGFkYXRhLWJhc2VkXG4gICduby1kZXByZWNhdGVkJzogcmVxdWlyZSgnLi9ydWxlcy9uby1kZXByZWNhdGVkJyksXG5cbiAgLy8gZGVwcmVjYXRlZCBhbGlhc2VzIHRvIHJ1bGVzXG4gICdpbXBvcnRzLWZpcnN0JzogcmVxdWlyZSgnLi9ydWxlcy9pbXBvcnRzLWZpcnN0JyksXG59XG5cbmV4cG9ydCBjb25zdCBjb25maWdzID0ge1xuICAncmVjb21tZW5kZWQnOiByZXF1aXJlKCcuLi9jb25maWcvcmVjb21tZW5kZWQnKSxcblxuICAnZXJyb3JzJzogcmVxdWlyZSgnLi4vY29uZmlnL2Vycm9ycycpLFxuICAnd2FybmluZ3MnOiByZXF1aXJlKCcuLi9jb25maWcvd2FybmluZ3MnKSxcblxuICAvLyBzaGhoaC4uLiB3b3JrIGluIHByb2dyZXNzIFwic2VjcmV0XCIgcnVsZXNcbiAgJ3N0YWdlLTAnOiByZXF1aXJlKCcuLi9jb25maWcvc3RhZ2UtMCcpLFxuXG4gIC8vIHVzZWZ1bCBzdHVmZiBmb3IgZm9sa3MgdXNpbmcgdmFyaW91cyBlbnZpcm9ubWVudHNcbiAgJ3JlYWN0JzogcmVxdWlyZSgnLi4vY29uZmlnL3JlYWN0JyksXG4gICdyZWFjdC1uYXRpdmUnOiByZXF1aXJlKCcuLi9jb25maWcvcmVhY3QtbmF0aXZlJyksXG4gICdlbGVjdHJvbic6IHJlcXVpcmUoJy4uL2NvbmZpZy9lbGVjdHJvbicpLFxufVxuIl19