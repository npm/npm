'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.recursivePatternCapture = recursivePatternCapture;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _doctrine = require('doctrine');

var _doctrine2 = _interopRequireDefault(_doctrine);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _parse = require('eslint-module-utils/parse');

var _parse2 = _interopRequireDefault(_parse);

var _resolve = require('eslint-module-utils/resolve');

var _resolve2 = _interopRequireDefault(_resolve);

var _ignore = require('eslint-module-utils/ignore');

var _ignore2 = _interopRequireDefault(_ignore);

var _hash = require('eslint-module-utils/hash');

var _unambiguous = require('eslint-module-utils/unambiguous');

var unambiguous = _interopRequireWildcard(_unambiguous);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const log = (0, _debug2.default)('eslint-plugin-import:ExportMap');

const exportCache = new Map();

class ExportMap {
  constructor(path) {
    this.path = path;
    this.namespace = new Map();
    // todo: restructure to key on path, value is resolver + map of names
    this.reexports = new Map();
    this.dependencies = new Map();
    this.errors = [];
  }

  get hasDefault() {
    return this.get('default') != null;
  } // stronger than this.has

  get size() {
    let size = this.namespace.size + this.reexports.size;
    this.dependencies.forEach(dep => size += dep().size);
    return size;
  }

  /**
   * Note that this does not check explicitly re-exported names for existence
   * in the base namespace, but it will expand all `export * from '...'` exports
   * if not found in the explicit namespace.
   * @param  {string}  name
   * @return {Boolean} true if `name` is exported by this module.
   */
  has(name) {
    if (this.namespace.has(name)) return true;
    if (this.reexports.has(name)) return true;

    // default exports must be explicitly re-exported (#328)
    if (name !== 'default') {
      for (let dep of this.dependencies.values()) {
        let innerMap = dep();

        // todo: report as unresolved?
        if (!innerMap) continue;

        if (innerMap.has(name)) return true;
      }
    }

    return false;
  }

  /**
   * ensure that imported name fully resolves.
   * @param  {[type]}  name [description]
   * @return {Boolean}      [description]
   */
  hasDeep(name) {
    if (this.namespace.has(name)) return { found: true, path: [this] };

    if (this.reexports.has(name)) {
      const reexports = this.reexports.get(name),
            imported = reexports.getImport();

      // if import is ignored, return explicit 'null'
      if (imported == null) return { found: true, path: [this] };

      // safeguard against cycles, only if name matches
      if (imported.path === this.path && reexports.local === name) {
        return { found: false, path: [this] };
      }

      const deep = imported.hasDeep(reexports.local);
      deep.path.unshift(this);

      return deep;
    }

    // default exports must be explicitly re-exported (#328)
    if (name !== 'default') {
      for (let dep of this.dependencies.values()) {
        let innerMap = dep();
        // todo: report as unresolved?
        if (!innerMap) continue;

        // safeguard against cycles
        if (innerMap.path === this.path) continue;

        let innerValue = innerMap.hasDeep(name);
        if (innerValue.found) {
          innerValue.path.unshift(this);
          return innerValue;
        }
      }
    }

    return { found: false, path: [this] };
  }

  get(name) {
    if (this.namespace.has(name)) return this.namespace.get(name);

    if (this.reexports.has(name)) {
      const reexports = this.reexports.get(name),
            imported = reexports.getImport();

      // if import is ignored, return explicit 'null'
      if (imported == null) return null;

      // safeguard against cycles, only if name matches
      if (imported.path === this.path && reexports.local === name) return undefined;

      return imported.get(reexports.local);
    }

    // default exports must be explicitly re-exported (#328)
    if (name !== 'default') {
      for (let dep of this.dependencies.values()) {
        let innerMap = dep();
        // todo: report as unresolved?
        if (!innerMap) continue;

        // safeguard against cycles
        if (innerMap.path === this.path) continue;

        let innerValue = innerMap.get(name);
        if (innerValue !== undefined) return innerValue;
      }
    }

    return undefined;
  }

  forEach(callback, thisArg) {
    this.namespace.forEach((v, n) => callback.call(thisArg, v, n, this));

    this.reexports.forEach((reexports, name) => {
      const reexported = reexports.getImport();
      // can't look up meta for ignored re-exports (#348)
      callback.call(thisArg, reexported && reexported.get(reexports.local), name, this);
    });

    this.dependencies.forEach(dep => {
      const d = dep();
      // CJS / ignored dependencies won't exist (#717)
      if (d == null) return;

      d.forEach((v, n) => n !== 'default' && callback.call(thisArg, v, n, this));
    });
  }

  // todo: keys, values, entries?

  reportErrors(context, declaration) {
    context.report({
      node: declaration.source,
      message: `Parse errors in imported module '${declaration.source.value}': ` + `${this.errors.map(e => `${e.message} (${e.lineNumber}:${e.column})`).join(', ')}`
    });
  }
}

exports.default = ExportMap; /**
                              * parse docs from the first node that has leading comments
                              * @param  {...[type]} nodes [description]
                              * @return {{doc: object}}
                              */

function captureDoc(docStyleParsers) {
  const metadata = {},
        nodes = Array.prototype.slice.call(arguments, 1);

  // 'some' short-circuits on first 'true'
  nodes.some(n => {
    if (!n.leadingComments) return false;

    for (let name in docStyleParsers) {
      const doc = docStyleParsers[name](n.leadingComments);
      if (doc) {
        metadata.doc = doc;
      }
    }

    return true;
  });

  return metadata;
}

const availableDocStyleParsers = {
  jsdoc: captureJsDoc,
  tomdoc: captureTomDoc
};

/**
 * parse JSDoc from leading comments
 * @param  {...[type]} comments [description]
 * @return {{doc: object}}
 */
function captureJsDoc(comments) {
  let doc;

  // capture XSDoc
  comments.forEach(comment => {
    // skip non-block comments
    if (comment.value.slice(0, 4) !== '*\n *') return;
    try {
      doc = _doctrine2.default.parse(comment.value, { unwrap: true });
    } catch (err) {
      /* don't care, for now? maybe add to `errors?` */
    }
  });

  return doc;
}

/**
  * parse TomDoc section from comments
  */
function captureTomDoc(comments) {
  // collect lines up to first paragraph break
  const lines = [];
  for (let i = 0; i < comments.length; i++) {
    const comment = comments[i];
    if (comment.value.match(/^\s*$/)) break;
    lines.push(comment.value.trim());
  }

  // return doctrine-like object
  const statusMatch = lines.join(' ').match(/^(Public|Internal|Deprecated):\s*(.+)/);
  if (statusMatch) {
    return {
      description: statusMatch[2],
      tags: [{
        title: statusMatch[1].toLowerCase(),
        description: statusMatch[2]
      }]
    };
  }
}

ExportMap.get = function (source, context) {
  const path = (0, _resolve2.default)(source, context);
  if (path == null) return null;

  return ExportMap.for(path, context);
};

ExportMap.for = function (path, context) {
  let exportMap;

  const cacheKey = (0, _hash.hashObject)({
    settings: context.settings,
    parserPath: context.parserPath,
    parserOptions: context.parserOptions,
    path
  }).digest('hex');

  exportMap = exportCache.get(cacheKey);

  // return cached ignore
  if (exportMap === null) return null;

  const stats = _fs2.default.statSync(path);
  if (exportMap != null) {
    // date equality check
    if (exportMap.mtime - stats.mtime === 0) {
      return exportMap;
    }
    // future: check content equality?
  }

  // check valid extensions first
  if (!(0, _ignore.hasValidExtension)(path, context)) {
    exportCache.set(cacheKey, null);
    return null;
  }

  const content = _fs2.default.readFileSync(path, { encoding: 'utf8' });

  // check for and cache ignore
  if ((0, _ignore2.default)(path, context) || !unambiguous.test(content)) {
    log('ignored path due to unambiguous regex or ignore settings:', path);
    exportCache.set(cacheKey, null);
    return null;
  }

  exportMap = ExportMap.parse(path, content, context);

  // ambiguous modules return null
  if (exportMap == null) return null;

  exportMap.mtime = stats.mtime;

  exportCache.set(cacheKey, exportMap);
  return exportMap;
};

ExportMap.parse = function (path, content, context) {
  var m = new ExportMap(path);

  try {
    var ast = (0, _parse2.default)(path, content, context);
  } catch (err) {
    log('parse error:', path, err);
    m.errors.push(err);
    return m; // can't continue
  }

  if (!unambiguous.isModule(ast)) return null;

  const docstyle = context.settings && context.settings['import/docstyle'] || ['jsdoc'];
  const docStyleParsers = {};
  docstyle.forEach(style => {
    docStyleParsers[style] = availableDocStyleParsers[style];
  });

  // attempt to collect module doc
  if (ast.comments) {
    ast.comments.some(c => {
      if (c.type !== 'Block') return false;
      try {
        const doc = _doctrine2.default.parse(c.value, { unwrap: true });
        if (doc.tags.some(t => t.title === 'module')) {
          m.doc = doc;
          return true;
        }
      } catch (err) {/* ignore */}
      return false;
    });
  }

  const namespaces = new Map();

  function remotePath(node) {
    return _resolve2.default.relative(node.source.value, path, context.settings);
  }

  function resolveImport(node) {
    const rp = remotePath(node);
    if (rp == null) return null;
    return ExportMap.for(rp, context);
  }

  function getNamespace(identifier) {
    if (!namespaces.has(identifier.name)) return;

    return function () {
      return resolveImport(namespaces.get(identifier.name));
    };
  }

  function addNamespace(object, identifier) {
    const nsfn = getNamespace(identifier);
    if (nsfn) {
      Object.defineProperty(object, 'namespace', { get: nsfn });
    }

    return object;
  }

  ast.body.forEach(function (n) {

    if (n.type === 'ExportDefaultDeclaration') {
      const exportMeta = captureDoc(docStyleParsers, n);
      if (n.declaration.type === 'Identifier') {
        addNamespace(exportMeta, n.declaration);
      }
      m.namespace.set('default', exportMeta);
      return;
    }

    if (n.type === 'ExportAllDeclaration') {
      let remoteMap = remotePath(n);
      if (remoteMap == null) return;
      m.dependencies.set(remoteMap, () => ExportMap.for(remoteMap, context));
      return;
    }

    // capture namespaces in case of later export
    if (n.type === 'ImportDeclaration') {
      let ns;
      if (n.specifiers.some(s => s.type === 'ImportNamespaceSpecifier' && (ns = s))) {
        namespaces.set(ns.local.name, n);
      }
      return;
    }

    if (n.type === 'ExportNamedDeclaration') {
      // capture declaration
      if (n.declaration != null) {
        switch (n.declaration.type) {
          case 'FunctionDeclaration':
          case 'ClassDeclaration':
          case 'TypeAlias': // flowtype with babel-eslint parser
          case 'InterfaceDeclaration':
          case 'TSEnumDeclaration':
          case 'TSInterfaceDeclaration':
          case 'TSAbstractClassDeclaration':
          case 'TSModuleDeclaration':
            m.namespace.set(n.declaration.id.name, captureDoc(docStyleParsers, n));
            break;
          case 'VariableDeclaration':
            n.declaration.declarations.forEach(d => recursivePatternCapture(d.id, id => m.namespace.set(id.name, captureDoc(docStyleParsers, d, n))));
            break;
        }
      }

      n.specifiers.forEach(s => {
        const exportMeta = {};
        let local;

        switch (s.type) {
          case 'ExportDefaultSpecifier':
            if (!n.source) return;
            local = 'default';
            break;
          case 'ExportNamespaceSpecifier':
            m.namespace.set(s.exported.name, Object.defineProperty(exportMeta, 'namespace', {
              get() {
                return resolveImport(n);
              }
            }));
            return;
          case 'ExportSpecifier':
            if (!n.source) {
              m.namespace.set(s.exported.name, addNamespace(exportMeta, s.local));
              return;
            }
          // else falls through
          default:
            local = s.local.name;
            break;
        }

        // todo: JSDoc
        m.reexports.set(s.exported.name, { local, getImport: () => resolveImport(n) });
      });
    }
  });

  return m;
};

/**
 * Traverse a pattern/identifier node, calling 'callback'
 * for each leaf identifier.
 * @param  {node}   pattern
 * @param  {Function} callback
 * @return {void}
 */
function recursivePatternCapture(pattern, callback) {
  switch (pattern.type) {
    case 'Identifier':
      // base case
      callback(pattern);
      break;

    case 'ObjectPattern':
      pattern.properties.forEach(p => {
        recursivePatternCapture(p.value, callback);
      });
      break;

    case 'ArrayPattern':
      pattern.elements.forEach(element => {
        if (element == null) return;
        recursivePatternCapture(element, callback);
      });
      break;
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkV4cG9ydE1hcC5qcyJdLCJuYW1lcyI6WyJyZWN1cnNpdmVQYXR0ZXJuQ2FwdHVyZSIsInVuYW1iaWd1b3VzIiwibG9nIiwiZXhwb3J0Q2FjaGUiLCJNYXAiLCJFeHBvcnRNYXAiLCJjb25zdHJ1Y3RvciIsInBhdGgiLCJuYW1lc3BhY2UiLCJyZWV4cG9ydHMiLCJkZXBlbmRlbmNpZXMiLCJlcnJvcnMiLCJoYXNEZWZhdWx0IiwiZ2V0Iiwic2l6ZSIsImZvckVhY2giLCJkZXAiLCJoYXMiLCJuYW1lIiwidmFsdWVzIiwiaW5uZXJNYXAiLCJoYXNEZWVwIiwiZm91bmQiLCJpbXBvcnRlZCIsImdldEltcG9ydCIsImxvY2FsIiwiZGVlcCIsInVuc2hpZnQiLCJpbm5lclZhbHVlIiwidW5kZWZpbmVkIiwiY2FsbGJhY2siLCJ0aGlzQXJnIiwidiIsIm4iLCJjYWxsIiwicmVleHBvcnRlZCIsImQiLCJyZXBvcnRFcnJvcnMiLCJjb250ZXh0IiwiZGVjbGFyYXRpb24iLCJyZXBvcnQiLCJub2RlIiwic291cmNlIiwibWVzc2FnZSIsInZhbHVlIiwibWFwIiwiZSIsImxpbmVOdW1iZXIiLCJjb2x1bW4iLCJqb2luIiwiY2FwdHVyZURvYyIsImRvY1N0eWxlUGFyc2VycyIsIm1ldGFkYXRhIiwibm9kZXMiLCJBcnJheSIsInByb3RvdHlwZSIsInNsaWNlIiwiYXJndW1lbnRzIiwic29tZSIsImxlYWRpbmdDb21tZW50cyIsImRvYyIsImF2YWlsYWJsZURvY1N0eWxlUGFyc2VycyIsImpzZG9jIiwiY2FwdHVyZUpzRG9jIiwidG9tZG9jIiwiY2FwdHVyZVRvbURvYyIsImNvbW1lbnRzIiwiY29tbWVudCIsInBhcnNlIiwidW53cmFwIiwiZXJyIiwibGluZXMiLCJpIiwibGVuZ3RoIiwibWF0Y2giLCJwdXNoIiwidHJpbSIsInN0YXR1c01hdGNoIiwiZGVzY3JpcHRpb24iLCJ0YWdzIiwidGl0bGUiLCJ0b0xvd2VyQ2FzZSIsImZvciIsImV4cG9ydE1hcCIsImNhY2hlS2V5Iiwic2V0dGluZ3MiLCJwYXJzZXJQYXRoIiwicGFyc2VyT3B0aW9ucyIsImRpZ2VzdCIsInN0YXRzIiwic3RhdFN5bmMiLCJtdGltZSIsInNldCIsImNvbnRlbnQiLCJyZWFkRmlsZVN5bmMiLCJlbmNvZGluZyIsInRlc3QiLCJtIiwiYXN0IiwiaXNNb2R1bGUiLCJkb2NzdHlsZSIsInN0eWxlIiwiYyIsInR5cGUiLCJ0IiwibmFtZXNwYWNlcyIsInJlbW90ZVBhdGgiLCJyZWxhdGl2ZSIsInJlc29sdmVJbXBvcnQiLCJycCIsImdldE5hbWVzcGFjZSIsImlkZW50aWZpZXIiLCJhZGROYW1lc3BhY2UiLCJvYmplY3QiLCJuc2ZuIiwiT2JqZWN0IiwiZGVmaW5lUHJvcGVydHkiLCJib2R5IiwiZXhwb3J0TWV0YSIsInJlbW90ZU1hcCIsIm5zIiwic3BlY2lmaWVycyIsInMiLCJpZCIsImRlY2xhcmF0aW9ucyIsImV4cG9ydGVkIiwicGF0dGVybiIsInByb3BlcnRpZXMiLCJwIiwiZWxlbWVudHMiLCJlbGVtZW50Il0sIm1hcHBpbmdzIjoiOzs7OztRQW1kZ0JBLHVCLEdBQUFBLHVCOztBQW5kaEI7Ozs7QUFFQTs7OztBQUVBOzs7O0FBRUE7Ozs7QUFDQTs7OztBQUNBOzs7O0FBRUE7O0FBQ0E7O0lBQVlDLFc7Ozs7OztBQUVaLE1BQU1DLE1BQU0scUJBQU0sZ0NBQU4sQ0FBWjs7QUFFQSxNQUFNQyxjQUFjLElBQUlDLEdBQUosRUFBcEI7O0FBRWUsTUFBTUMsU0FBTixDQUFnQjtBQUM3QkMsY0FBWUMsSUFBWixFQUFrQjtBQUNoQixTQUFLQSxJQUFMLEdBQVlBLElBQVo7QUFDQSxTQUFLQyxTQUFMLEdBQWlCLElBQUlKLEdBQUosRUFBakI7QUFDQTtBQUNBLFNBQUtLLFNBQUwsR0FBaUIsSUFBSUwsR0FBSixFQUFqQjtBQUNBLFNBQUtNLFlBQUwsR0FBb0IsSUFBSU4sR0FBSixFQUFwQjtBQUNBLFNBQUtPLE1BQUwsR0FBYyxFQUFkO0FBQ0Q7O0FBRUQsTUFBSUMsVUFBSixHQUFpQjtBQUFFLFdB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QUFRaUcsRUFBRWpHLEtBQUYsQ0FBUVAsSUFBaEI7QUFDQTtBQWxCSjs7QUFxQkE7QUFDQStFLFVBQUV4RixTQUFGLENBQVltRixHQUFaLENBQWdCOEIsRUFBRUcsUUFBRixDQUFXM0csSUFBM0IsRUFBaUMsRUFBRU8sS0FBRixFQUFTRCxXQUFXLE1BQU1vRixjQUFjM0UsQ0FBZCxDQUExQixFQUFqQztBQUNELE9BM0JEO0FBNEJEO0FBQ0YsR0E5RUQ7O0FBZ0ZBLFNBQU9nRSxDQUFQO0FBQ0QsQ0FqSkQ7O0FBb0pBOzs7Ozs7O0FBT08sU0FBU2pHLHVCQUFULENBQWlDOEgsT0FBakMsRUFBMENoRyxRQUExQyxFQUFvRDtBQUN6RCxVQUFRZ0csUUFBUXZCLElBQWhCO0FBQ0UsU0FBSyxZQUFMO0FBQW1CO0FBQ2pCekUsZUFBU2dHLE9BQVQ7QUFDQTs7QUFFRixTQUFLLGVBQUw7QUFDRUEsY0FBUUMsVUFBUixDQUFtQmhILE9BQW5CLENBQTJCaUgsS0FBSztBQUM5QmhJLGdDQUF3QmdJLEVBQUVwRixLQUExQixFQUFpQ2QsUUFBakM7QUFDRCxPQUZEO0FBR0E7O0FBRUYsU0FBSyxjQUFMO0FBQ0VnRyxjQUFRRyxRQUFSLENBQWlCbEgsT0FBakIsQ0FBMEJtSCxPQUFELElBQWE7QUFDcEMsWUFBSUEsV0FBVyxJQUFmLEVBQXFCO0FBQ3JCbEksZ0NBQXdCa0ksT0FBeEIsRUFBaUNwRyxRQUFqQztBQUNELE9BSEQ7QUFJQTtBQWhCSjtBQWtCRCIsImZpbGUiOiJFeHBvcnRNYXAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZnMgZnJvbSAnZnMnXG5cbmltcG9ydCBkb2N0cmluZSBmcm9tICdkb2N0cmluZSdcblxuaW1wb3J0IGRlYnVnIGZyb20gJ2RlYnVnJ1xuXG5pbXBvcnQgcGFyc2UgZnJvbSAnZXNsaW50LW1vZHVsZS11dGlscy9wYXJzZSdcbmltcG9ydCByZXNvbHZlIGZyb20gJ2VzbGludC1tb2R1bGUtdXRpbHMvcmVzb2x2ZSdcbmltcG9ydCBpc0lnbm9yZWQsIHsgaGFzVmFsaWRFeHRlbnNpb24gfSBmcm9tICdlc2xpbnQtbW9kdWxlLXV0aWxzL2lnbm9yZSdcblxuaW1wb3J0IHsgaGFzaE9iamVjdCB9IGZyb20gJ2VzbGludC1tb2R1bGUtdXRpbHMvaGFzaCdcbmltcG9ydCAqIGFzIHVuYW1iaWd1b3VzIGZyb20gJ2VzbGludC1tb2R1bGUtdXRpbHMvdW5hbWJpZ3VvdXMnXG5cbmNvbnN0IGxvZyA9IGRlYnVnKCdlc2xpbnQtcGx1Z2luLWltcG9ydDpFeHBvcnRNYXAnKVxuXG5jb25zdCBleHBvcnRDYWNoZSA9IG5ldyBNYXAoKVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBFeHBvcnRNYXAge1xuICBjb25zdHJ1Y3RvcihwYXRoKSB7XG4gICAgdGhpcy5wYXRoID0gcGF0aFxuICAgIHRoaXMubmFtZXNwYWNlID0gbmV3IE1hcCgpXG4gICAgLy8gdG9kbzogcmVzdHJ1Y3R1cmUgdG8ga2V5IG9uIHBhdGgsIHZhbHVlIGlzIHJlc29sdmVyICsgbWFwIG9mIG5hbWVzXG4gICAgdGhpcy5yZWV4cG9ydHMgPSBuZXcgTWFwKClcbiAgICB0aGlzLmRlcGVuZGVuY2llcyA9IG5ldyBNYXAoKVxuICAgIHRoaXMuZXJyb3JzID0gW11cbiAgfVxuXG4gIGdldCBoYXNEZWZhdWx0KCkgeyByZXR1cm4gdGhpcy5nZXQoJ2RlZmF1bHQnKSAhPSBudWxsIH0gLy8gc3Ryb25nZXIgdGhhbiB0aGlzLmhhc1xuXG4gIGdldCBzaXplKCkge1xuICAgIGxldCBzaXplID0gdGhpcy5uYW1lc3BhY2Uuc2l6ZSArIHRoaXMucmVleHBvcnRzLnNpemVcbiAgICB0aGlzLmRlcGVuZGVuY2llcy5mb3JFYWNoKGRlcCA9PiBzaXplICs9IGRlcCgpLnNpemUpXG4gICAgcmV0dXJuIHNpemVcbiAgfVxuXG4gIC8qKlxuICAgKiBOb3RlIHRoYXQgdGhpcyBkb2VzIG5vdCBjaGVjayBleHBsaWNpdGx5IHJlLWV4cG9ydGVkIG5hbWVzIGZvciBleGlzdGVuY2VcbiAgICogaW4gdGhlIGJhc2UgbmFtZXNwYWNlLCBidXQgaXQgd2lsbCBleHBhbmQgYWxsIGBleHBvcnQgKiBmcm9tICcuLi4nYCBleHBvcnRzXG4gICAqIGlmIG5vdCBmb3VuZCBpbiB0aGUgZXhwbGljaXQgbmFtZXNwYWNlLlxuICAgKiBAcGFyYW0gIHtzdHJpbmd9ICBuYW1lXG4gICAqIEByZXR1cm4ge0Jvb2xlYW59IHRydWUgaWYgYG5hbWVgIGlzIGV4cG9ydGVkIGJ5IHRoaXMgbW9kdWxlLlxuICAgKi9cbiAgaGFzKG5hbWUpIHtcbiAgICBpZiAodGhpcy5uYW1lc3BhY2UuaGFzKG5hbWUpKSByZXR1cm4gdHJ1ZVxuICAgIGlmICh0aGlzLnJlZXhwb3J0cy5oYXMobmFtZSkpIHJldHVybiB0cnVlXG5cbiAgICAvLyBkZWZhdWx0IGV4cG9ydHMgbXVzdCBiZSBleHBsaWNpdGx5IHJlLWV4cG9ydGVkICgjMzI4KVxuICAgIGlmIChuYW1lICE9PSAnZGVmYXVsdCcpIHtcbiAgICAgIGZvciAobGV0IGRlcCBvZiB0aGlzLmRlcGVuZGVuY2llcy52YWx1ZXMoKSkge1xuICAgICAgICBsZXQgaW5uZXJNYXAgPSBkZXAoKVxuXG4gICAgICAgIC8vIHRvZG86IHJlcG9ydCBhcyB1bnJlc29sdmVkP1xuICAgICAgICBpZiAoIWlubmVyTWFwKSBjb250aW51ZVxuXG4gICAgICAgIGlmIChpbm5lck1hcC5oYXMobmFtZSkpIHJldHVybiB0cnVlXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICAvKipcbiAgICogZW5zdXJlIHRoYXQgaW1wb3J0ZWQgbmFtZSBmdWxseSByZXNvbHZlcy5cbiAgICogQHBhcmFtICB7W3R5cGVdfSAgbmFtZSBbZGVzY3JpcHRpb25dXG4gICAqIEByZXR1cm4ge0Jvb2xlYW59ICAgICAgW2Rlc2NyaXB0aW9uXVxuICAgKi9cbiAgaGFzRGVlcChuYW1lKSB7XG4gICAgaWYgKHRoaXMubmFtZXNwYWNlLmhhcyhuYW1lKSkgcmV0dXJuIHsgZm91bmQ6IHRydWUsIHBhdGg6IFt0aGlzXSB9XG5cbiAgICBpZiAodGhpcy5yZWV4cG9ydHMuaGFzKG5hbWUpKSB7XG4gICAgICBjb25zdCByZWV4cG9ydHMgPSB0aGlzLnJlZXhwb3J0cy5nZXQobmFtZSlcbiAgICAgICAgICAsIGltcG9ydGVkID0gcmVleHBvcnRzLmdldEltcG9ydCgpXG5cbiAgICAgIC8vIGlmIGltcG9ydCBpcyBpZ25vcmVkLCByZXR1cm4gZXhwbGljaXQgJ251bGwnXG4gICAgICBpZiAoaW1wb3J0ZWQgPT0gbnVsbCkgcmV0dXJuIHsgZm91bmQ6IHRydWUsIHBhdGg6IFt0aGlzXSB9XG5cbiAgICAgIC8vIHNhZmVndWFyZCBhZ2FpbnN0IGN5Y2xlcywgb25seSBpZiBuYW1lIG1hdGNoZXNcbiAgICAgIGlmIChpbXBvcnRlZC5wYXRoID09PSB0aGlzLnBhdGggJiYgcmVleHBvcnRzLmxvY2FsID09PSBuYW1lKSB7XG4gICAgICAgIHJldHVybiB7IGZvdW5kOiBmYWxzZSwgcGF0aDogW3RoaXNdIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgZGVlcCA9IGltcG9ydGVkLmhhc0RlZXAocmVleHBvcnRzLmxvY2FsKVxuICAgICAgZGVlcC5wYXRoLnVuc2hpZnQodGhpcylcblxuICAgICAgcmV0dXJuIGRlZXBcbiAgICB9XG5cblxuICAgIC8vIGRlZmF1bHQgZXhwb3J0cyBtdXN0IGJlIGV4cGxpY2l0bHkgcmUtZXhwb3J0ZWQgKCMzMjgpXG4gICAgaWYgKG5hbWUgIT09ICdkZWZhdWx0Jykge1xuICAgICAgZm9yIChsZXQgZGVwIG9mIHRoaXMuZGVwZW5kZW5jaWVzLnZhbHVlcygpKSB7XG4gICAgICAgIGxldCBpbm5lck1hcCA9IGRlcCgpXG4gICAgICAgIC8vIHRvZG86IHJlcG9ydCBhcyB1bnJlc29sdmVkP1xuICAgICAgICBpZiAoIWlubmVyTWFwKSBjb250aW51ZVxuXG4gICAgICAgIC8vIHNhZmVndWFyZCBhZ2FpbnN0IGN5Y2xlc1xuICAgICAgICBpZiAoaW5uZXJNYXAucGF0aCA9PT0gdGhpcy5wYXRoKSBjb250aW51ZVxuXG4gICAgICAgIGxldCBpbm5lclZhbHVlID0gaW5uZXJNYXAuaGFzRGVlcChuYW1lKVxuICAgICAgICBpZiAoaW5uZXJWYWx1ZS5mb3VuZCkge1xuICAgICAgICAgIGlubmVyVmFsdWUucGF0aC51bnNoaWZ0KHRoaXMpXG4gICAgICAgICAgcmV0dXJuIGlubmVyVmFsdWVcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7IGZvdW5kOiBmYWxzZSwgcGF0aDogW3RoaXNdIH1cbiAgfVxuXG4gIGdldChuYW1lKSB7XG4gICAgaWYgKHRoaXMubmFtZXNwYWNlLmhhcyhuYW1lKSkgcmV0dXJuIHRoaXMubmFtZXNwYWNlLmdldChuYW1lKVxuXG4gICAgaWYgKHRoaXMucmVleHBvcnRzLmhhcyhuYW1lKSkge1xuICAgICAgY29uc3QgcmVleHBvcnRzID0gdGhpcy5yZWV4cG9ydHMuZ2V0KG5hbWUpXG4gICAgICAgICAgLCBpbXBvcnRlZCA9IHJlZXhwb3J0cy5nZXRJbXBvcnQoKVxuXG4gICAgICAvLyBpZiBpbXBvcnQgaXMgaWdub3JlZCwgcmV0dXJuIGV4cGxpY2l0ICdudWxsJ1xuICAgICAgaWYgKGltcG9ydGVkID09IG51bGwpIHJldHVybiBudWxsXG5cbiAgICAgIC8vIHNhZmVndWFyZCBhZ2FpbnN0IGN5Y2xlcywgb25seSBpZiBuYW1lIG1hdGNoZXNcbiAgICAgIGlmIChpbXBvcnRlZC5wYXRoID09PSB0aGlzLnBhdGggJiYgcmVleHBvcnRzLmxvY2FsID09PSBuYW1lKSByZXR1cm4gdW5kZWZpbmVkXG5cbiAgICAgIHJldHVybiBpbXBvcnRlZC5nZXQocmVleHBvcnRzLmxvY2FsKVxuICAgIH1cblxuICAgIC8vIGRlZmF1bHQgZXhwb3J0cyBtdXN0IGJlIGV4cGxpY2l0bHkgcmUtZXhwb3J0ZWQgKCMzMjgpXG4gICAgaWYgKG5hbWUgIT09ICdkZWZhdWx0Jykge1xuICAgICAgZm9yIChsZXQgZGVwIG9mIHRoaXMuZGVwZW5kZW5jaWVzLnZhbHVlcygpKSB7XG4gICAgICAgIGxldCBpbm5lck1hcCA9IGRlcCgpXG4gICAgICAgIC8vIHRvZG86IHJlcG9ydCBhcyB1bnJlc29sdmVkP1xuICAgICAgICBpZiAoIWlubmVyTWFwKSBjb250aW51ZVxuXG4gICAgICAgIC8vIHNhZmVndWFyZCBhZ2FpbnN0IGN5Y2xlc1xuICAgICAgICBpZiAoaW5uZXJNYXAucGF0aCA9PT0gdGhpcy5wYXRoKSBjb250aW51ZVxuXG4gICAgICAgIGxldCBpbm5lclZhbHVlID0gaW5uZXJNYXAuZ2V0KG5hbWUpXG4gICAgICAgIGlmIChpbm5lclZhbHVlICE9PSB1bmRlZmluZWQpIHJldHVybiBpbm5lclZhbHVlXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuICB9XG5cbiAgZm9yRWFjaChjYWxsYmFjaywgdGhpc0FyZykge1xuICAgIHRoaXMubmFtZXNwYWNlLmZvckVhY2goKHYsIG4pID0+XG4gICAgICBjYWxsYmFjay5jYWxsKHRoaXNBcmcsIHYsIG4sIHRoaXMpKVxuXG4gICAgdGhpcy5yZWV4cG9ydHMuZm9yRWFjaCgocmVleHBvcnRzLCBuYW1lKSA9PiB7XG4gICAgICBjb25zdCByZWV4cG9ydGVkID0gcmVleHBvcnRzLmdldEltcG9ydCgpXG4gICAgICAvLyBjYW4ndCBsb29rIHVwIG1ldGEgZm9yIGlnbm9yZWQgcmUtZXhwb3J0cyAoIzM0OClcbiAgICAgIGNhbGxiYWNrLmNhbGwodGhpc0FyZywgcmVleHBvcnRlZCAmJiByZWV4cG9ydGVkLmdldChyZWV4cG9ydHMubG9jYWwpLCBuYW1lLCB0aGlzKVxuICAgIH0pXG5cbiAgICB0aGlzLmRlcGVuZGVuY2llcy5mb3JFYWNoKGRlcCA9PiB7XG4gICAgICBjb25zdCBkID0gZGVwKClcbiAgICAgIC8vIENKUyAvIGlnbm9yZWQgZGVwZW5kZW5jaWVzIHdvbid0IGV4aXN0ICgjNzE3KVxuICAgICAgaWYgKGQgPT0gbnVsbCkgcmV0dXJuXG5cbiAgICAgIGQuZm9yRWFjaCgodiwgbikgPT5cbiAgICAgICAgbiAhPT0gJ2RlZmF1bHQnICYmIGNhbGxiYWNrLmNhbGwodGhpc0FyZywgdiwgbiwgdGhpcykpXG4gICAgfSlcbiAgfVxuXG4gIC8vIHRvZG86IGtleXMsIHZhbHVlcywgZW50cmllcz9cblxuICByZXBvcnRFcnJvcnMoY29udGV4dCwgZGVjbGFyYXRpb24pIHtcbiAgICBjb250ZXh0LnJlcG9ydCh7XG4gICAgICBub2RlOiBkZWNsYXJhdGlvbi5zb3VyY2UsXG4gICAgICBtZXNzYWdlOiBgUGFyc2UgZXJyb3JzIGluIGltcG9ydGVkIG1vZHVsZSAnJHtkZWNsYXJhdGlvbi5zb3VyY2UudmFsdWV9JzogYCArXG4gICAgICAgICAgICAgICAgICBgJHt0aGlzLmVycm9yc1xuICAgICAgICAgICAgICAgICAgICAgICAgLm1hcChlID0+IGAke2UubWVzc2FnZX0gKCR7ZS5saW5lTnVtYmVyfToke2UuY29sdW1ufSlgKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmpvaW4oJywgJyl9YCxcbiAgICB9KVxuICB9XG59XG5cbi8qKlxuICogcGFyc2UgZG9jcyBmcm9tIHRoZSBmaXJzdCBub2RlIHRoYXQgaGFzIGxlYWRpbmcgY29tbWVudHNcbiAqIEBwYXJhbSAgey4uLlt0eXBlXX0gbm9kZXMgW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7e2RvYzogb2JqZWN0fX1cbiAqL1xuZnVuY3Rpb24gY2FwdHVyZURvYyhkb2NTdHlsZVBhcnNlcnMpIHtcbiAgY29uc3QgbWV0YWRhdGEgPSB7fVxuICAgICAgICwgbm9kZXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpXG5cbiAgLy8gJ3NvbWUnIHNob3J0LWNpcmN1aXRzIG9uIGZpcnN0ICd0cnVlJ1xuICBub2Rlcy5zb21lKG4gPT4ge1xuICAgIGlmICghbi5sZWFkaW5nQ29tbWVudHMpIHJldHVybiBmYWxzZVxuXG4gICAgZm9yIChsZXQgbmFtZSBpbiBkb2NTdHlsZVBhcnNlcnMpIHtcbiAgICAgIGNvbnN0IGRvYyA9IGRvY1N0eWxlUGFyc2Vyc1tuYW1lXShuLmxlYWRpbmdDb21tZW50cylcbiAgICAgIGlmIChkb2MpIHtcbiAgICAgICAgbWV0YWRhdGEuZG9jID0gZG9jXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWVcbiAgfSlcblxuICByZXR1cm4gbWV0YWRhdGFcbn1cblxuY29uc3QgYXZhaWxhYmxlRG9jU3R5bGVQYXJzZXJzID0ge1xuICBqc2RvYzogY2FwdHVyZUpzRG9jLFxuICB0b21kb2M6IGNhcHR1cmVUb21Eb2MsXG59XG5cbi8qKlxuICogcGFyc2UgSlNEb2MgZnJvbSBsZWFkaW5nIGNvbW1lbnRzXG4gKiBAcGFyYW0gIHsuLi5bdHlwZV19IGNvbW1lbnRzIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge3tkb2M6IG9iamVjdH19XG4gKi9cbmZ1bmN0aW9uIGNhcHR1cmVKc0RvYyhjb21tZW50cykge1xuICBsZXQgZG9jXG5cbiAgLy8gY2FwdHVyZSBYU0RvY1xuICBjb21tZW50cy5mb3JFYWNoKGNvbW1lbnQgPT4ge1xuICAgIC8vIHNraXAgbm9uLWJsb2NrIGNvbW1lbnRzXG4gICAgaWYgKGNvbW1lbnQudmFsdWUuc2xpY2UoMCwgNCkgIT09ICcqXFxuIConKSByZXR1cm5cbiAgICB0cnkge1xuICAgICAgZG9jID0gZG9jdHJpbmUucGFyc2UoY29tbWVudC52YWx1ZSwgeyB1bndyYXA6IHRydWUgfSlcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIC8qIGRvbid0IGNhcmUsIGZvciBub3c/IG1heWJlIGFkZCB0byBgZXJyb3JzP2AgKi9cbiAgICB9XG4gIH0pXG5cbiAgcmV0dXJuIGRvY1xufVxuXG4vKipcbiAgKiBwYXJzZSBUb21Eb2Mgc2VjdGlvbiBmcm9tIGNvbW1lbnRzXG4gICovXG5mdW5jdGlvbiBjYXB0dXJlVG9tRG9jKGNvbW1lbnRzKSB7XG4gIC8vIGNvbGxlY3QgbGluZXMgdXAgdG8gZmlyc3QgcGFyYWdyYXBoIGJyZWFrXG4gIGNvbnN0IGxpbmVzID0gW11cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb21tZW50cy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGNvbW1lbnQgPSBjb21tZW50c1tpXVxuICAgIGlmIChjb21tZW50LnZhbHVlLm1hdGNoKC9eXFxzKiQvKSkgYnJlYWtcbiAgICBsaW5lcy5wdXNoKGNvbW1lbnQudmFsdWUudHJpbSgpKVxuICB9XG5cbiAgLy8gcmV0dXJuIGRvY3RyaW5lLWxpa2Ugb2JqZWN0XG4gIGNvbnN0IHN0YXR1c01hdGNoID0gbGluZXMuam9pbignICcpLm1hdGNoKC9eKFB1YmxpY3xJbnRlcm5hbHxEZXByZWNhdGVkKTpcXHMqKC4rKS8pXG4gIGlmIChzdGF0dXNNYXRjaCkge1xuICAgIHJldHVybiB7XG4gICAgICBkZXNjcmlwdGlvbjogc3RhdHVzTWF0Y2hbMl0sXG4gICAgICB0YWdzOiBbe1xuICAgICAgICB0aXRsZTogc3RhdHVzTWF0Y2hbMV0udG9Mb3dlckNhc2UoKSxcbiAgICAgICAgZGVzY3JpcHRpb246IHN0YXR1c01hdGNoWzJdLFxuICAgICAgfV0sXG4gICAgfVxuICB9XG59XG5cbkV4cG9ydE1hcC5nZXQgPSBmdW5jdGlvbiAoc291cmNlLCBjb250ZXh0KSB7XG4gIGNvbnN0IHBhdGggPSByZXNvbHZlKHNvdXJjZSwgY29udGV4dClcbiAgaWYgKHBhdGggPT0gbnVsbCkgcmV0dXJuIG51bGxcblxuICByZXR1cm4gRXhwb3J0TWFwLmZvcihwYXRoLCBjb250ZXh0KVxufVxuXG5FeHBvcnRNYXAuZm9yID0gZnVuY3Rpb24gKHBhdGgsIGNvbnRleHQpIHtcbiAgbGV0IGV4cG9ydE1hcFxuXG4gIGNvbnN0IGNhY2hlS2V5ID0gaGFzaE9iamVjdCh7XG4gICAgc2V0dGluZ3M6IGNvbnRleHQuc2V0dGluZ3MsXG4gICAgcGFyc2VyUGF0aDogY29udGV4dC5wYXJzZXJQYXRoLFxuICAgIHBhcnNlck9wdGlvbnM6IGNvbnRleHQucGFyc2VyT3B0aW9ucyxcbiAgICBwYXRoLFxuICB9KS5kaWdlc3QoJ2hleCcpXG5cbiAgZXhwb3J0TWFwID0gZXhwb3J0Q2FjaGUuZ2V0KGNhY2hlS2V5KVxuXG4gIC8vIHJldHVybiBjYWNoZWQgaWdub3JlXG4gIGlmIChleHBvcnRNYXAgPT09IG51bGwpIHJldHVybiBudWxsXG5cbiAgY29uc3Qgc3RhdHMgPSBmcy5zdGF0U3luYyhwYXRoKVxuICBpZiAoZXhwb3J0TWFwICE9IG51bGwpIHtcbiAgICAvLyBkYXRlIGVxdWFsaXR5IGNoZWNrXG4gICAgaWYgKGV4cG9ydE1hcC5tdGltZSAtIHN0YXRzLm10aW1lID09PSAwKSB7XG4gICAgICByZXR1cm4gZXhwb3J0TWFwXG4gICAgfVxuICAgIC8vIGZ1dHVyZTogY2hlY2sgY29udGVudCBlcXVhbGl0eT9cbiAgfVxuXG4gIC8vIGNoZWNrIHZhbGlkIGV4dGVuc2lvbnMgZmlyc3RcbiAgaWYgKCFoYXNWYWxpZEV4dGVuc2lvbihwYXRoLCBjb250ZXh0KSkge1xuICAgIGV4cG9ydENhY2hlLnNldChjYWNoZUtleSwgbnVsbClcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgY29uc3QgY29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhwYXRoLCB7IGVuY29kaW5nOiAndXRmOCcgfSlcblxuICAvLyBjaGVjayBmb3IgYW5kIGNhY2hlIGlnbm9yZVxuICBpZiAoaXNJZ25vcmVkKHBhdGgsIGNvbnRleHQpIHx8ICF1bmFtYmlndW91cy50ZXN0KGNvbnRlbnQpKSB7XG4gICAgbG9nKCdpZ25vcmVkIHBhdGggZHVlIHRvIHVuYW1iaWd1b3VzIHJlZ2V4IG9yIGlnbm9yZSBzZXR0aW5nczonLCBwYXRoKVxuICAgIGV4cG9ydENhY2hlLnNldChjYWNoZUtleSwgbnVsbClcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgZXhwb3J0TWFwID0gRXhwb3J0TWFwLnBhcnNlKHBhdGgsIGNvbnRlbnQsIGNvbnRleHQpXG5cbiAgLy8gYW1iaWd1b3VzIG1vZHVsZXMgcmV0dXJuIG51bGxcbiAgaWYgKGV4cG9ydE1hcCA9PSBudWxsKSByZXR1cm4gbnVsbFxuXG4gIGV4cG9ydE1hcC5tdGltZSA9IHN0YXRzLm10aW1lXG5cbiAgZXhwb3J0Q2FjaGUuc2V0KGNhY2hlS2V5LCBleHBvcnRNYXApXG4gIHJldHVybiBleHBvcnRNYXBcbn1cblxuXG5FeHBvcnRNYXAucGFyc2UgPSBmdW5jdGlvbiAocGF0aCwgY29udGVudCwgY29udGV4dCkge1xuICB2YXIgbSA9IG5ldyBFeHBvcnRNYXAocGF0aClcblxuICB0cnkge1xuICAgIHZhciBhc3QgPSBwYXJzZShwYXRoLCBjb250ZW50LCBjb250ZXh0KVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBsb2coJ3BhcnNlIGVycm9yOicsIHBhdGgsIGVycilcbiAgICBtLmVycm9ycy5wdXNoKGVycilcbiAgICByZXR1cm4gbSAvLyBjYW4ndCBjb250aW51ZVxuICB9XG5cbiAgaWYgKCF1bmFtYmlndW91cy5pc01vZHVsZShhc3QpKSByZXR1cm4gbnVsbFxuXG4gIGNvbnN0IGRvY3N0eWxlID0gKGNvbnRleHQuc2V0dGluZ3MgJiYgY29udGV4dC5zZXR0aW5nc1snaW1wb3J0L2RvY3N0eWxlJ10pIHx8IFsnanNkb2MnXVxuICBjb25zdCBkb2NTdHlsZVBhcnNlcnMgPSB7fVxuICBkb2NzdHlsZS5mb3JFYWNoKHN0eWxlID0+IHtcbiAgICBkb2NTdHlsZVBhcnNlcnNbc3R5bGVdID0gYXZhaWxhYmxlRG9jU3R5bGVQYXJzZXJzW3N0eWxlXVxuICB9KVxuXG4gIC8vIGF0dGVtcHQgdG8gY29sbGVjdCBtb2R1bGUgZG9jXG4gIGlmIChhc3QuY29tbWVudHMpIHtcbiAgICBhc3QuY29tbWVudHMuc29tZShjID0+IHtcbiAgICAgIGlmIChjLnR5cGUgIT09ICdCbG9jaycpIHJldHVybiBmYWxzZVxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgZG9jID0gZG9jdHJpbmUucGFyc2UoYy52YWx1ZSwgeyB1bndyYXA6IHRydWUgfSlcbiAgICAgICAgaWYgKGRvYy50YWdzLnNvbWUodCA9PiB0LnRpdGxlID09PSAnbW9kdWxlJykpIHtcbiAgICAgICAgICBtLmRvYyA9IGRvY1xuICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGVycikgeyAvKiBpZ25vcmUgKi8gfVxuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfSlcbiAgfVxuXG4gIGNvbnN0IG5hbWVzcGFjZXMgPSBuZXcgTWFwKClcblxuICBmdW5jdGlvbiByZW1vdGVQYXRoKG5vZGUpIHtcbiAgICByZXR1cm4gcmVzb2x2ZS5yZWxhdGl2ZShub2RlLnNvdXJjZS52YWx1ZSwgcGF0aCwgY29udGV4dC5zZXR0aW5ncylcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlc29sdmVJbXBvcnQobm9kZSkge1xuICAgIGNvbnN0IHJwID0gcmVtb3RlUGF0aChub2RlKVxuICAgIGlmIChycCA9PSBudWxsKSByZXR1cm4gbnVsbFxuICAgIHJldHVybiBFeHBvcnRNYXAuZm9yKHJwLCBjb250ZXh0KVxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0TmFtZXNwYWNlKGlkZW50aWZpZXIpIHtcbiAgICBpZiAoIW5hbWVzcGFjZXMuaGFzKGlkZW50aWZpZXIubmFtZSkpIHJldHVyblxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiByZXNvbHZlSW1wb3J0KG5hbWVzcGFjZXMuZ2V0KGlkZW50aWZpZXIubmFtZSkpXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gYWRkTmFtZXNwYWNlKG9iamVjdCwgaWRlbnRpZmllcikge1xuICAgIGNvbnN0IG5zZm4gPSBnZXROYW1lc3BhY2UoaWRlbnRpZmllcilcbiAgICBpZiAobnNmbikge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iamVjdCwgJ25hbWVzcGFjZScsIHsgZ2V0OiBuc2ZuIH0pXG4gICAgfVxuXG4gICAgcmV0dXJuIG9iamVjdFxuICB9XG5cblxuICBhc3QuYm9keS5mb3JFYWNoKGZ1bmN0aW9uIChuKSB7XG5cbiAgICBpZiAobi50eXBlID09PSAnRXhwb3J0RGVmYXVsdERlY2xhcmF0aW9uJykge1xuICAgICAgY29uc3QgZXhwb3J0TWV0YSA9IGNhcHR1cmVEb2MoZG9jU3R5bGVQYXJzZXJzLCBuKVxuICAgICAgaWYgKG4uZGVjbGFyYXRpb24udHlwZSA9PT0gJ0lkZW50aWZpZXInKSB7XG4gICAgICAgIGFkZE5hbWVzcGFjZShleHBvcnRNZXRhLCBuLmRlY2xhcmF0aW9uKVxuICAgICAgfVxuICAgICAgbS5uYW1lc3BhY2Uuc2V0KCdkZWZhdWx0JywgZXhwb3J0TWV0YSlcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGlmIChuLnR5cGUgPT09ICdFeHBvcnRBbGxEZWNsYXJhdGlvbicpIHtcbiAgICAgIGxldCByZW1vdGVNYXAgPSByZW1vdGVQYXRoKG4pXG4gICAgICBpZiAocmVtb3RlTWFwID09IG51bGwpIHJldHVyblxuICAgICAgbS5kZXBlbmRlbmNpZXMuc2V0KHJlbW90ZU1hcCwgKCkgPT4gRXhwb3J0TWFwLmZvcihyZW1vdGVNYXAsIGNvbnRleHQpKVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgLy8gY2FwdHVyZSBuYW1lc3BhY2VzIGluIGNhc2Ugb2YgbGF0ZXIgZXhwb3J0XG4gICAgaWYgKG4udHlwZSA9PT0gJ0ltcG9ydERlY2xhcmF0aW9uJykge1xuICAgICAgbGV0IG5zXG4gICAgICBpZiAobi5zcGVjaWZpZXJzLnNvbWUocyA9PiBzLnR5cGUgPT09ICdJbXBvcnROYW1lc3BhY2VTcGVjaWZpZXInICYmIChucyA9IHMpKSkge1xuICAgICAgICBuYW1lc3BhY2VzLnNldChucy5sb2NhbC5uYW1lLCBuKVxuICAgICAgfVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgaWYgKG4udHlwZSA9PT0gJ0V4cG9ydE5hbWVkRGVjbGFyYXRpb24nKXtcbiAgICAgIC8vIGNhcHR1cmUgZGVjbGFyYXRpb25cbiAgICAgIGlmIChuLmRlY2xhcmF0aW9uICE9IG51bGwpIHtcbiAgICAgICAgc3dpdGNoIChuLmRlY2xhcmF0aW9uLnR5cGUpIHtcbiAgICAgICAgICBjYXNlICdGdW5jdGlvbkRlY2xhcmF0aW9uJzpcbiAgICAgICAgICBjYXNlICdDbGFzc0RlY2xhcmF0aW9uJzpcbiAgICAgICAgICBjYXNlICdUeXBlQWxpYXMnOiAvLyBmbG93dHlwZSB3aXRoIGJhYmVsLWVzbGludCBwYXJzZXJcbiAgICAgICAgICBjYXNlICdJbnRlcmZhY2VEZWNsYXJhdGlvbic6XG4gICAgICAgICAgY2FzZSAnVFNFbnVtRGVjbGFyYXRpb24nOlxuICAgICAgICAgIGNhc2UgJ1RTSW50ZXJmYWNlRGVjbGFyYXRpb24nOlxuICAgICAgICAgIGNhc2UgJ1RTQWJzdHJhY3RDbGFzc0RlY2xhcmF0aW9uJzpcbiAgICAgICAgICBjYXNlICdUU01vZHVsZURlY2xhcmF0aW9uJzpcbiAgICAgICAgICAgIG0ubmFtZXNwYWNlLnNldChuLmRlY2xhcmF0aW9uLmlkLm5hbWUsIGNhcHR1cmVEb2MoZG9jU3R5bGVQYXJzZXJzLCBuKSlcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgY2FzZSAnVmFyaWFibGVEZWNsYXJhdGlvbic6XG4gICAgICAgICAgICBuLmRlY2xhcmF0aW9uLmRlY2xhcmF0aW9ucy5mb3JFYWNoKChkKSA9PlxuICAgICAgICAgICAgICByZWN1cnNpdmVQYXR0ZXJuQ2FwdHVyZShkLmlkLFxuICAgICAgICAgICAgICAgIGlkID0+IG0ubmFtZXNwYWNlLnNldChpZC5uYW1lLCBjYXB0dXJlRG9jKGRvY1N0eWxlUGFyc2VycywgZCwgbikpKSlcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgbi5zcGVjaWZpZXJzLmZvckVhY2goKHMpID0+IHtcbiAgICAgICAgY29uc3QgZXhwb3J0TWV0YSA9IHt9XG4gICAgICAgIGxldCBsb2NhbFxuXG4gICAgICAgIHN3aXRjaCAocy50eXBlKSB7XG4gICAgICAgICAgY2FzZSAnRXhwb3J0RGVmYXVsdFNwZWNpZmllcic6XG4gICAgICAgICAgICBpZiAoIW4uc291cmNlKSByZXR1cm5cbiAgICAgICAgICAgIGxvY2FsID0gJ2RlZmF1bHQnXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIGNhc2UgJ0V4cG9ydE5hbWVzcGFjZVNwZWNpZmllcic6XG4gICAgICAgICAgICBtLm5hbWVzcGFjZS5zZXQocy5leHBvcnRlZC5uYW1lLCBPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0TWV0YSwgJ25hbWVzcGFjZScsIHtcbiAgICAgICAgICAgICAgZ2V0KCkgeyByZXR1cm4gcmVzb2x2ZUltcG9ydChuKSB9LFxuICAgICAgICAgICAgfSkpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICBjYXNlICdFeHBvcnRTcGVjaWZpZXInOlxuICAgICAgICAgICAgaWYgKCFuLnNvdXJjZSkge1xuICAgICAgICAgICAgICBtLm5hbWVzcGFjZS5zZXQocy5leHBvcnRlZC5uYW1lLCBhZGROYW1lc3BhY2UoZXhwb3J0TWV0YSwgcy5sb2NhbCkpXG4gICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gZWxzZSBmYWxscyB0aHJvdWdoXG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGxvY2FsID0gcy5sb2NhbC5uYW1lXG4gICAgICAgICAgICBicmVha1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdG9kbzogSlNEb2NcbiAgICAgICAgbS5yZWV4cG9ydHMuc2V0KHMuZXhwb3J0ZWQubmFtZSwgeyBsb2NhbCwgZ2V0SW1wb3J0OiAoKSA9PiByZXNvbHZlSW1wb3J0KG4pIH0pXG4gICAgICB9KVxuICAgIH1cbiAgfSlcblxuICByZXR1cm4gbVxufVxuXG5cbi8qKlxuICogVHJhdmVyc2UgYSBwYXR0ZXJuL2lkZW50aWZpZXIgbm9kZSwgY2FsbGluZyAnY2FsbGJhY2snXG4gKiBmb3IgZWFjaCBsZWFmIGlkZW50aWZpZXIuXG4gKiBAcGFyYW0gIHtub2RlfSAgIHBhdHRlcm5cbiAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjYWxsYmFja1xuICogQHJldHVybiB7dm9pZH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlY3Vyc2l2ZVBhdHRlcm5DYXB0dXJlKHBhdHRlcm4sIGNhbGxiYWNrKSB7XG4gIHN3aXRjaCAocGF0dGVybi50eXBlKSB7XG4gICAgY2FzZSAnSWRlbnRpZmllcic6IC8vIGJhc2UgY2FzZVxuICAgICAgY2FsbGJhY2socGF0dGVybilcbiAgICAgIGJyZWFrXG5cbiAgICBjYXNlICdPYmplY3RQYXR0ZXJuJzpcbiAgICAgIHBhdHRlcm4ucHJvcGVydGllcy5mb3JFYWNoKHAgPT4ge1xuICAgICAgICByZWN1cnNpdmVQYXR0ZXJuQ2FwdHVyZShwLnZhbHVlLCBjYWxsYmFjaylcbiAgICAgIH0pXG4gICAgICBicmVha1xuXG4gICAgY2FzZSAnQXJyYXlQYXR0ZXJuJzpcbiAgICAgIHBhdHRlcm4uZWxlbWVudHMuZm9yRWFjaCgoZWxlbWVudCkgPT4ge1xuICAgICAgICBpZiAoZWxlbWVudCA9PSBudWxsKSByZXR1cm5cbiAgICAgICAgcmVjdXJzaXZlUGF0dGVybkNhcHR1cmUoZWxlbWVudCwgY2FsbGJhY2spXG4gICAgICB9KVxuICAgICAgYnJlYWtcbiAgfVxufVxuIl19