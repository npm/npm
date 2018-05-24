'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.isAbsolute = isAbsolute;
exports.isBuiltIn = isBuiltIn;
exports.isExternalModuleMain = isExternalModuleMain;
exports.isScopedMain = isScopedMain;
exports.default = resolveImportType;

var _cond = require('lodash/cond');

var _cond2 = _interopRequireDefault(_cond);

var _builtinModules = require('builtin-modules');

var _builtinModules2 = _interopRequireDefault(_builtinModules);

var _path = require('path');

var _resolve = require('eslint-module-utils/resolve');

var _resolve2 = _interopRequireDefault(_resolve);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function constant(value) {
  return () => value;
}

function baseModule(name) {
  if (isScoped(name)) {
    var _name$split = name.split('/'),
        _name$split2 = _slicedToArray(_name$split, 2);

    const scope = _name$split2[0],
          pkg = _name$split2[1];

    return `${scope}/${pkg}`;
  }

  var _name$split3 = name.split('/'),
      _name$split4 = _slicedToArray(_name$split3, 1);

  const pkg = _name$split4[0];

  return pkg;
}

function isAbsolute(name) {
  return name.indexOf('/') === 0;
}

function isBuiltIn(name, settings) {
  const base = baseModule(name);
  const extras = settings && settings['import/core-modules'] || [];
  return _builtinModules2.default.indexOf(base) !== -1 || extras.indexOf(base) > -1;
}

function isExternalPath(path, name, settings) {
  const folders = settings && settings['import/external-module-folders'] || ['node_modules'];
  return !path || folders.some(folder => -1 < path.indexOf((0, _path.join)(folder, name)));
}

const externalModuleRegExp = /^\w/;
function isExternalModule(name, settings, path) {
  return externalModuleRegExp.test(name) && isExternalPath(path, name, settings);
}

const externalModuleMainRegExp = /^[\w]((?!\/).)*$/;
function isExternalModuleMain(name, settings, path) {
  return externalModuleMainRegExp.test(name) && isExternalPath(path, name, settings);
}

const scopedRegExp = /^@[^/]+\/[^/]+/;
function isScoped(name) {
  return scopedRegExp.test(name);
}

const scopedMainRegExp = /^@[^/]+\/?[^/]+$/;
function isScopedMain(name) {
  return scopedMainRegExp.test(name);
}

function isInternalModule(name, settings, path) {
  return externalModuleRegExp.test(name) && !isExternalPath(path, name, settings);
}

function isRelativeToParent(name) {
  return name.indexOf('../') === 0;
}

const indexFiles = ['.', './', './index', './index.js'];
function isIndex(name) {
  return indexFiles.indexOf(name) !== -1;
}

function isRelativeToSibling(name) {
  return name.indexOf('./') === 0;
}

const typeTest = (0, _cond2.default)([[isAbsolute, constant('absolute')], [isBuiltIn, constant('builtin')], [isExternalModule, constant('external')], [isScoped, constant('external')], [isInternalModule, constant('internal')], [isRelativeToParent, constant('parent')], [isIndex, constant('index')], [isRelativeToSibling, constant('sibling')], [constant(true), constant('unknown')]]);

function resolveImportType(name, context) {
  return typeTest(name, context.settings, (0, _resolve2.default)(name, context));
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvcmUvaW1wb3J0VHlwZS5qcyJdLCJuYW1lcyI6WyJpc0Fic29sdXRlIiwiaXNCdWlsdEluIiwiaXNFeHRlcm5hbE1vZHVsZU1haW4iLCJpc1Njb3BlZE1haW4iLCJyZXNvbHZlSW1wb3J0VHlwZSIsImNvbnN0YW50IiwidmFsdWUiLCJiYXNlTW9kdWxlIiwibmFtZSIsImlzU2NvcGVkIiwic3BsaXQiLCJzY29wZSIsInBrZyIsImluZGV4T2YiLCJzZXR0aW5ncyIsImJhc2UiLCJleHRyYXMiLCJpc0V4dGVybmFsUGF0aCIsInBhdGgiLCJmb2xkZXJzIiwic29tZSIsImZvbGRlciIsImV4dGVybmFsTW9kdWxlUmVnRXhwIiwiaXNFeHRlcm5hbE1vZHVsZSIsInRlc3QiLCJleHRlcm5hbE1vZHVsZU1haW5SZWdFeHAiLCJzY29wZWRSZWdFeHAiLCJzY29wZWRNYWluUmVnRXhwIiwiaXNJbnRlcm5hbE1vZHVsZSIsImlzUmVsYXRpdmVUb1BhcmVudCIsImluZGV4RmlsZXMiLCJpc0luZGV4IiwiaXNSZWxhdGl2ZVRvU2libGluZyIsInR5cGVUZXN0IiwiY29udGV4dCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7UUFtQmdCQSxVLEdBQUFBLFU7UUFJQUMsUyxHQUFBQSxTO1FBaUJBQyxvQixHQUFBQSxvQjtRQVVBQyxZLEdBQUFBLFk7a0JBaUNRQyxpQjs7QUFuRnhCOzs7O0FBQ0E7Ozs7QUFDQTs7QUFFQTs7Ozs7O0FBRUEsU0FBU0MsUUFBVCxDQUFrQkMsS0FBbEIsRUFBeUI7QUFDdkIsU0FBTyxNQUFNQSxLQUFiO0FBQ0Q7O0FBRUQsU0FBU0MsVUFBVCxDQUFvQkMsSUFBcEIsRUFBMEI7QUFDeEIsTUFBSUMsU0FBU0QsSUFBVCxDQUFKLEVBQW9CO0FBQUEsc0JBQ0dBLEtBQUtFLEtBQUwsQ0FBVyxHQUFYLENBREg7QUFBQTs7QUFBQSxVQUNYQyxLQURXO0FBQUEsVUFDSkMsR0FESTs7QUFFbEIsV0FBUSxHQUFFRCxLQUFNLElBQUdDLEdBQUksRUFBdkI7QUFD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SyxTQUFTLFVBQVQsQ0FBYixDQURvQixFQUVwQixDQUFDSixTQUFELEVBQVlJLFNBQVMsU0FBVCxDQUFaLENBRm9CLEVBR3BCLENBQUNrQixnQkFBRCxFQUFtQmxCLFNBQVMsVUFBVCxDQUFuQixDQUhvQixFQUlwQixDQUFDSSxRQUFELEVBQVdKLFNBQVMsVUFBVCxDQUFYLENBSm9CLEVBS3BCLENBQUN1QixnQkFBRCxFQUFtQnZCLFNBQVMsVUFBVCxDQUFuQixDQUxvQixFQU1wQixDQUFDd0Isa0JBQUQsRUFBcUJ4QixTQUFTLFFBQVQsQ0FBckIsQ0FOb0IsRUFPcEIsQ0FBQzBCLE9BQUQsRUFBVTFCLFNBQVMsT0FBVCxDQUFWLENBUG9CLEVBUXBCLENBQUMyQixtQkFBRCxFQUFzQjNCLFNBQVMsU0FBVCxDQUF0QixDQVJvQixFQVNwQixDQUFDQSxTQUFTLElBQVQsQ0FBRCxFQUFpQkEsU0FBUyxTQUFULENBQWpCLENBVG9CLENBQUwsQ0FBakI7O0FBWWUsU0FBU0QsaUJBQVQsQ0FBMkJJLElBQTNCLEVBQWlDMEIsT0FBakMsRUFBMEM7QUFDdkQsU0FBT0QsU0FBU3pCLElBQVQsRUFBZTBCLFFBQVFwQixRQUF2QixFQUFpQyx1QkFBUU4sSUFBUixFQUFjMEIsT0FBZCxDQUFqQyxDQUFQO0FBQ0QiLCJmaWxlIjoiY29yZS9pbXBvcnRUeXBlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGNvbmQgZnJvbSAnbG9kYXNoL2NvbmQnXG5pbXBvcnQgYnVpbHRpbk1vZHVsZXMgZnJvbSAnYnVpbHRpbi1tb2R1bGVzJ1xuaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnXG5cbmltcG9ydCByZXNvbHZlIGZyb20gJ2VzbGludC1tb2R1bGUtdXRpbHMvcmVzb2x2ZSdcblxuZnVuY3Rpb24gY29uc3RhbnQodmFsdWUpIHtcbiAgcmV0dXJuICgpID0+IHZhbHVlXG59XG5cbmZ1bmN0aW9uIGJhc2VNb2R1bGUobmFtZSkge1xuICBpZiAoaXNTY29wZWQobmFtZSkpIHtcbiAgICBjb25zdCBbc2NvcGUsIHBrZ10gPSBuYW1lLnNwbGl0KCcvJylcbiAgICByZXR1cm4gYCR7c2NvcGV9LyR7cGtnfWBcbiAgfVxuICBjb25zdCBbcGtnXSA9IG5hbWUuc3BsaXQoJy8nKVxuICByZXR1cm4gcGtnXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0Fic29sdXRlKG5hbWUpIHtcbiAgcmV0dXJuIG5hbWUuaW5kZXhPZignLycpID09PSAwXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0J1aWx0SW4obmFtZSwgc2V0dGluZ3MpIHtcbiAgY29uc3QgYmFzZSA9IGJhc2VNb2R1bGUobmFtZSlcbiAgY29uc3QgZXh0cmFzID0gKHNldHRpbmdzICYmIHNldHRpbmdzWydpbXBvcnQvY29yZS1tb2R1bGVzJ10pIHx8IFtdXG4gIHJldHVybiBidWlsdGluTW9kdWxlcy5pbmRleE9mKGJhc2UpICE9PSAtMSB8fCBleHRyYXMuaW5kZXhPZihiYXNlKSA+IC0xXG59XG5cbmZ1bmN0aW9uIGlzRXh0ZXJuYWxQYXRoKHBhdGgsIG5hbWUsIHNldHRpbmdzKSB7XG4gIGNvbnN0IGZvbGRlcnMgPSAoc2V0dGluZ3MgJiYgc2V0dGluZ3NbJ2ltcG9ydC9leHRlcm5hbC1tb2R1bGUtZm9sZGVycyddKSB8fCBbJ25vZGVfbW9kdWxlcyddXG4gIHJldHVybiAhcGF0aCB8fCBmb2xkZXJzLnNvbWUoZm9sZGVyID0+IC0xIDwgcGF0aC5pbmRleE9mKGpvaW4oZm9sZGVyLCBuYW1lKSkpXG59XG5cbmNvbnN0IGV4dGVybmFsTW9kdWxlUmVnRXhwID0gL15cXHcvXG5mdW5jdGlvbiBpc0V4dGVybmFsTW9kdWxlKG5hbWUsIHNldHRpbmdzLCBwYXRoKSB7XG4gIHJldHVybiBleHRlcm5hbE1vZHVsZVJlZ0V4cC50ZXN0KG5hbWUpICYmIGlzRXh0ZXJuYWxQYXRoKHBhdGgsIG5hbWUsIHNldHRpbmdzKVxufVxuXG5jb25zdCBleHRlcm5hbE1vZHVsZU1haW5SZWdFeHAgPSAvXltcXHddKCg/IVxcLykuKSokL1xuZXhwb3J0IGZ1bmN0aW9uIGlzRXh0ZXJuYWxNb2R1bGVNYWluKG5hbWUsIHNldHRpbmdzLCBwYXRoKSB7XG4gIHJldHVybiBleHRlcm5hbE1vZHVsZU1haW5SZWdFeHAudGVzdChuYW1lKSAmJiBpc0V4dGVybmFsUGF0aChwYXRoLCBuYW1lLCBzZXR0aW5ncylcbn1cblxuY29uc3Qgc2NvcGVkUmVnRXhwID0gL15AW14vXStcXC9bXi9dKy9cbmZ1bmN0aW9uIGlzU2NvcGVkKG5hbWUpIHtcbiAgcmV0dXJuIHNjb3BlZFJlZ0V4cC50ZXN0KG5hbWUpXG59XG5cbmNvbnN0IHNjb3BlZE1haW5SZWdFeHAgPSAvXkBbXi9dK1xcLz9bXi9dKyQvXG5leHBvcnQgZnVuY3Rpb24gaXNTY29wZWRNYWluKG5hbWUpIHtcbiAgcmV0dXJuIHNjb3BlZE1haW5SZWdFeHAudGVzdChuYW1lKVxufVxuXG5mdW5jdGlvbiBpc0ludGVybmFsTW9kdWxlKG5hbWUsIHNldHRpbmdzLCBwYXRoKSB7XG4gIHJldHVybiBleHRlcm5hbE1vZHVsZVJlZ0V4cC50ZXN0KG5hbWUpICYmICFpc0V4dGVybmFsUGF0aChwYXRoLCBuYW1lLCBzZXR0aW5ncylcbn1cblxuZnVuY3Rpb24gaXNSZWxhdGl2ZVRvUGFyZW50KG5hbWUpIHtcbiAgcmV0dXJuIG5hbWUuaW5kZXhPZignLi4vJykgPT09IDBcbn1cblxuY29uc3QgaW5kZXhGaWxlcyA9IFsnLicsICcuLycsICcuL2luZGV4JywgJy4vaW5kZXguanMnXVxuZnVuY3Rpb24gaXNJbmRleChuYW1lKSB7XG4gIHJldHVybiBpbmRleEZpbGVzLmluZGV4T2YobmFtZSkgIT09IC0xXG59XG5cbmZ1bmN0aW9uIGlzUmVsYXRpdmVUb1NpYmxpbmcobmFtZSkge1xuICByZXR1cm4gbmFtZS5pbmRleE9mKCcuLycpID09PSAwXG59XG5cbmNvbnN0IHR5cGVUZXN0ID0gY29uZChbXG4gIFtpc0Fic29sdXRlLCBjb25zdGFudCgnYWJzb2x1dGUnKV0sXG4gIFtpc0J1aWx0SW4sIGNvbnN0YW50KCdidWlsdGluJyldLFxuICBbaXNFeHRlcm5hbE1vZHVsZSwgY29uc3RhbnQoJ2V4dGVybmFsJyldLFxuICBbaXNTY29wZWQsIGNvbnN0YW50KCdleHRlcm5hbCcpXSxcbiAgW2lzSW50ZXJuYWxNb2R1bGUsIGNvbnN0YW50KCdpbnRlcm5hbCcpXSxcbiAgW2lzUmVsYXRpdmVUb1BhcmVudCwgY29uc3RhbnQoJ3BhcmVudCcpXSxcbiAgW2lzSW5kZXgsIGNvbnN0YW50KCdpbmRleCcpXSxcbiAgW2lzUmVsYXRpdmVUb1NpYmxpbmcsIGNvbnN0YW50KCdzaWJsaW5nJyldLFxuICBbY29uc3RhbnQodHJ1ZSksIGNvbnN0YW50KCd1bmtub3duJyldLFxuXSlcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gcmVzb2x2ZUltcG9ydFR5cGUobmFtZSwgY29udGV4dCkge1xuICByZXR1cm4gdHlwZVRlc3QobmFtZSwgY29udGV4dC5zZXR0aW5ncywgcmVzb2x2ZShuYW1lLCBjb250ZXh0KSlcbn1cbiJdfQ==