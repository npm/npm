'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = docsUrl;

var _package = require('../package.json');

var _package2 = _interopRequireDefault(_package);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const repoUrl = 'https://github.com/benmosher/eslint-plugin-import';

function docsUrl(ruleName) {
  let commitish = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : `v${_package2.default.version}`;

  return `${repoUrl}/blob/${commitish}/docs/rules/${ruleName}.md`;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRvY3NVcmwuanMiXSwibmFtZXMiOlsiZG9jc1VybCIsInJlcG9VcmwiLCJydWxlTmFtZSIsImNvbW1pdGlzaCIsInZlcnNpb24iXSwibWFwcGluZ3MiOiI7Ozs7O2tCQUl3QkEsTzs7QUFKeEI7Ozs7OztBQUVBLE1BQU1DLFVBQVUsbURBQWhCOztBQUVlLFNBQVNELE9BQVQsQ0FBaUJFLFFBQWpCLEVBQTBEO0FBQUEsTUFBL0JDLFNBQStCLHVFQUFsQixJQUFHLGtCQUFJQyxPQUFRLEVBQUc7O0FBQ3ZFLFNBQVEsR0FBRUgsT0FBUSxTQUFRRSxTQUFVLGVBQWNELFFBQVMsS0FBM0Q7QUFDRCIsImZpbGUiOiJkb2NzVXJsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBrZyBmcm9tICcuLi9wYWNrYWdlLmpzb24nXG5cbmNvbnN0IHJlcG9VcmwgPSAnaHR0cHM6Ly9naXRodWIuY29tL2Jlbm1vc2hlci9lc2xpbnQtcGx1Z2luLWltcG9ydCdcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZG9jc1VybChydWxlTmFtZSwgY29tbWl0aXNoID0gYHYke3BrZy52ZXJzaW9ufWApIHtcbiAgcmV0dXJuIGAke3JlcG9Vcmx9L2Jsb2IvJHtjb21taXRpc2h9L2RvY3MvcnVsZXMvJHtydWxlTmFtZX0ubWRgXG59XG4iXX0=