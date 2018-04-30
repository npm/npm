import { statSync } from 'fs';
import { dirname, resolve, basename, extname, sep } from 'path';
import { makeLegalIdentifier, attachScopes, createFilter } from 'rollup-pluginutils';
import { walk } from 'estree-walker';
import MagicString from 'magic-string';
import { sync } from 'resolve';

var HELPERS_ID = '\0commonjsHelpers';

var HELPERS = "\nexport var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};\n\nexport function commonjsRequire () {\n\tthrow new Error('Dynamic requires are not currently supported by rollup-plugin-commonjs');\n}\n\nexport function unwrapExports (x) {\n\treturn x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;\n}\n\nexport function createCommonjsModule(fn, module) {\n\treturn module = { exports: {} }, fn(module, module.exports), module.exports;\n}";

var PREFIX = '\0commonjs-proxy:';
var EXTERNAL = '\0commonjs-external:';

function isFile ( file ) {
	try {
		var stats = statSync( file );
		return stats.isFile();
	} catch ( err ) {
		return false;
	}
}

function addJsExtensionIfNecessary ( file ) {
	if ( isFile( file ) ) { return file; }

	file += '.js';
	if ( isFile( file ) ) { return file; }

	return null;
}

var absolutePath = /^(?:\/|(?:[A-Za-z]:)?[\\|/])/;

function isAbsolute ( path ) {
	return absolutePath.test( path );
}

function defaultResolver ( importee, importer ) {
	// absolute paths are left untouched
	if ( isAbsolute( importee ) ) { return addJsExtensionIfNecessary( resolve( importee ) ); }

	// if this is the entry point, resolve against cwd
	if ( importer === undefined ) { return addJsExtensionIfNecessary( resolve( process.cwd(), importee ) ); }

	// external modules are skipped at this stage
	if ( importee[0] !== '.' ) { return null; }

	return addJsExtensionIfNecessary( resolve( dirname( importer ), importee ) );
}

function isReference ( node, parent ) {
	if ( parent.type === 'MemberExpression' ) { return parent.computed || node === parent.object; }

	// disregard the `bar` in { bar: foo }
	if ( parent.type === 'Property' && node !== parent.value ) { return false; }

	// disregard the `bar` in `class Foo { bar () {...} }`
	if ( parent.type === 'MethodDefinition' ) { return false; }

	// disregard the `bar` in `export { foo as bar }`
	if ( parent.type === 'ExportSpecifier' && node !== parent.local ) { return false; }

	return true;
}

function flatten ( node ) {
	var parts = [];

	while ( node.type === 'MemberExpression' ) {
		if ( node.computed ) { return null; }

		parts.unshift( node.property.name );
		node = node.object;
	}

	if ( node.type !== 'Identifier' ) { return null; }

	var name = node.name;
	parts.unshift( name );

	return { name: name, keypath: parts.join( '.' ) };
}

function extractNames ( node ) {
	var names = [];
	extractors[ node.type ]( names, node );
	return names;
}

var extractors = {
	Identifier: function Identifier ( names, node ) {
		names.push( node.name );
	},

	ObjectPattern: function ObjectPattern ( names, node ) {
		node.properties.forEach( function (prop) {
			extractors[ prop.value.type ]( names, prop.value );
		});
	},

	ArrayPattern: function ArrayPattern ( names, node ) {
		node.elements.forEach( function (element) {
			if ( element ) { extractors[ element.type ]( names, element ); }
		});
	},

	RestElement: function RestElement ( names, node ) {
		extractors[ node.argument.type ]( names, node.argument );
	},

	AssignmentPattern: function AssignmentPattern ( names, node ) {
		extractors[ node.left.type ]( names, node.left );
	}
};


function isTruthy ( node ) {
	if ( node.type === 'Literal' ) { return !!node.value; }
	if ( node.type === 'ParenthesizedExpression' ) { return isTruthy( node.expression ); }
	if ( node.operator in operators ) { return operators[ node.operator ]( node ); }
}

function isFalsy ( node ) {
	return not( isTruthy( node ) );
}

function not ( value ) {
	return value === undefined ? value : !value;
}

function equals ( a, b, strict ) {
	if ( a.type !== b.type ) { return undefined; }
	if ( a.type === 'Literal' ) { return strict ? a.value === b.value : a.value == b.value; }
}

var operators = {
	'==': function (x) {
		return equals( x.left, x.right, false );
	},

	'!=': function (x) { return not( operators['==']( x ) ); },

	'===': function (x) {
		return equals( x.left, x.right, true );
	},

	'!==': function (x) { return not( operators['===']( x ) ); },

	'!': function (x) { return isFalsy( x.argument ); },

	'&&': function (x) { return isTruthy( x.left ) && isTruthy( x.right ); },

	'||': function (x) { return isTruthy( x.left ) || isTruthy( x.right ); }
};

function getName ( id ) {
	var name = makeLegalIdentifier( basename( id, extname( id ) ) );
	if (name !== 'index') {
		return name;
	} else {
		var segments = dirname( id ).split( sep );
		return makeLegalIdentifier( segments[segments.length - 1] );
	}
}

var reserved = 'abstract arguments boolean break byte case catch char class const continue debugger default delete do double else enum eval export extends false final finally float for function goto if implements import in instanceof int interface let long native new null package private protected public return short static super switch synchronized this throw throws transient true try typeof var void volatile while with yield'.split( ' ' );
var blacklist = { __esModule: true };
reserved.forEach( function (word) { return blacklist[ word ] = true; } );

var exportsPattern = /^(?:module\.)?exports(?:\.([a-zA-Z_$][a-zA-Z_$0-9]*))?$/;

var firstpassGlobal = /\b(?:require|module|exports|global)\b/;
var firstpassNoGlobal = /\b(?:require|module|exports)\b/;
var importExportDeclaration = /^(?:Import|Export(?:Named|Default))Declaration/;
var functionType = /^(?:FunctionDeclaration|FunctionExpression|ArrowFunctionExpression)$/;

function deconflict ( scope, globals, identifier ) {
	var i = 1;
	var deconflicted = identifier;

	while ( scope.contains( deconflicted ) || globals.has( deconflicted ) || deconflicted in blacklist ) { deconflicted = identifier + "_" + (i++); }
	scope.declarations[ deconflicted ] = true;

	return deconflicted;
}

function tryParse ( parse, code, id ) {
	try {
		return parse( code, { allowReturnOutsideFunction: true });
	} catch ( err ) {
		err.message += " in " + id;
		throw err;
	}
}

function checkFirstpass (code, ignoreGlobal) {
	var firstpass = ignoreGlobal ? firstpassNoGlobal : firstpassGlobal;
	return firstpass.test(code);
}

function checkEsModule ( parse, code, id ) {
	var ast = tryParse( parse, code, id );

	// if there are top-level import/export declarations, this is ES not CommonJS
	var hasDefaultExport = false;
	var isEsModule = false;
	for ( var i = 0, list = ast.body; i < list.length; i += 1 ) {
		var node = list[i];

		if ( node.type === 'ExportDefaultDeclaration' )
			{ hasDefaultExport = true; }
		if ( importExportDeclaration.test( node.type ) )
			{ isEsModule = true; }
	}

	return { isEsModule: isEsModule, hasDefaultExport: hasDefaultExport, ast: ast };
}

function transformCommonjs ( parse, code, id, isEntry, ignoreGlobal, ignoreRequire, customNamedExports, sourceMap, allowDynamicRequire, astCache ) {
	var ast = astCache || tryParse( parse, code, id );

	var magicString = new MagicString( code );

	var required = {};
	// Because objects have no guaranteed ordering, yet we need it,
	// we need to keep track of the order in a array
	var sources = [];

	var uid = 0;

	var scope = attachScopes( ast, 'scope' );
	var uses = { module: false, exports: false, global: false, require: false };

	var lexicalDepth = 0;
	var programDepth = 0;

	var globals = new Set();

	var HELPERS_NAME = deconflict( scope, globals, 'commonjsHelpers' ); // TODO technically wrong since globals isn't populated yet, but ¯\_(ツ)_/¯

	var namedExports = {};

	// TODO handle transpiled modules
	var shouldWrap = /__esModule/.test( code );

	function isRequireStatement ( node ) {
		if ( !node ) { return; }
		if ( node.type !== 'CallExpression' ) { return; }
		if ( node.callee.name !== 'require' || scope.contains( 'require' ) ) { return; }
		if ( node.arguments.length !== 1 || (node.arguments[0].type !== 'Literal' && (node.arguments[0].type !== 'TemplateLiteral' || node.arguments[0].expressions.length > 0) ) ) { return; } // TODO handle these weird cases?
		if ( ignoreRequire( node.arguments[0].value ) ) { return; }

		return true;
	}

	function getRequired ( node, name ) {
		var source = node.arguments[0].type === 'Literal' ? node.arguments[0].value : node.arguments[0].quasis[0].value.cooked;

		var existing = required[ source ];
		if ( existing === undefined ) {
			sources.push( source );

			if ( !name ) {
				do { name = "require$$" + (uid++); }
				while ( scope.contains( name ) );
			}

			required[ source ] = { source: source, name: name, importsDefault: false };
		}

		return required[ source ];
	}

	// do a first pass, see which names are assigned to. This is necessary to prevent
	// illegally replacing `var foo = require('foo')` with `import foo from 'foo'`,
	// where `foo` is later reassigned. (This happens in the wild. CommonJS, sigh)
	var assignedTo = new Set();
	walk( ast, {
		enter: function enter ( node ) {
			if ( node.type !== 'AssignmentExpression' ) { return; }
			if ( node.left.type === 'MemberExpression' ) { return; }

			extractNames( node.left ).forEach( function (name) {
				assignedTo.add( name );
			});
		}
	});

	walk( ast, {
		enter: function enter ( node, parent ) {
			if ( sourceMap ) {
				magicString.addSourcemapLocation( node.start );
				magicString.addSourcemapLocation( node.end );
			}

			// skip dead branches
			if ( parent && ( parent.type === 'IfStatement' || parent.type === 'ConditionalExpression' ) ) {
				if ( node === parent.consequent && isFalsy( parent.test ) ) { return this.skip(); }
				if ( node === parent.alternate && isTruthy( parent.test ) ) { return this.skip(); }
			}

			if ( node._skip ) { return this.skip(); }

			programDepth += 1;

			if ( node.scope ) { scope = node.scope; }
			if ( functionType.test( node.type ) ) { lexicalDepth += 1; }

			// if toplevel return, we need to wrap it
			if ( node.type === 'ReturnStatement' && lexicalDepth === 0 ) {
				shouldWrap = true;
			}

			// rewrite `this` as `commonjsHelpers.commonjsGlobal`
			if ( node.type === 'ThisExpression' && lexicalDepth === 0 ) {
				uses.global = true;
				if ( !ignoreGlobal ) { magicString.overwrite( node.start, node.end, (HELPERS_NAME + ".commonjsGlobal"), { storeName: true } ); }
				return;
			}

			// rewrite `typeof module`, `typeof module.exports` and `typeof exports` (https://github.com/rollup/rollup-plugin-commonjs/issues/151)
			if ( node.type === 'UnaryExpression' && node.operator === 'typeof' ) {
				var flattened = flatten( node.argument );
				if ( !flattened ) { return; }

				if ( scope.contains( flattened.name ) ) { return; }

				if ( flattened.keypath === 'module.exports' || flattened.keypath === 'module' || flattened.keypath === 'exports' ) {
					magicString.overwrite( node.start, node.end, "'object'", { storeName: false } );
				}
			}

			// rewrite `require` (if not already handled) `global` and `define`, and handle free references to
			// `module` and `exports` as these mean we need to wrap the module in commonjsHelpers.createCommonjsModule
			if ( node.type === 'Identifier' ) {
				if ( isReference( node, parent ) && !scope.contains( node.name ) ) {
					if ( node.name in uses ) {
						if ( node.name === 'require' ) {
							if ( allowDynamicRequire ) { return; }
							magicString.overwrite( node.start, node.end, (HELPERS_NAME + ".commonjsRequire"), { storeName: true } );
						}

						uses[ node.name ] = true;
						if ( node.name === 'global' && !ignoreGlobal ) {
							magicString.overwrite( node.start, node.end, (HELPERS_NAME + ".commonjsGlobal"), { storeName: true } );
						}

						// if module or exports are used outside the context of an assignment
						// expression, we need to wrap the module
						if ( node.name === 'module' || node.name === 'exports' ) {
							shouldWrap = true;
						}
					}

					if ( node.name === 'define' ) {
						magicString.overwrite( node.start, node.end, 'undefined', { storeName: true } );
					}

					globals.add( node.name );
				}

				return;
			}

			// Is this an assignment to exports or module.exports?
			if ( node.type === 'AssignmentExpression' ) {
				if ( node.left.type !== 'MemberExpression' ) { return; }

				var flattened$1 = flatten( node.left );
				if ( !flattened$1 ) { return; }

				if ( scope.contains( flattened$1.name ) ) { return; }

				var match = exportsPattern.exec( flattened$1.keypath );
				if ( !match || flattened$1.keypath === 'exports' ) { return; }

				uses[ flattened$1.name ] = true;

				// we're dealing with `module.exports = ...` or `[module.]exports.foo = ...` –
				// if this isn't top-level, we'll need to wrap the module
				if ( programDepth > 3 ) { shouldWrap = true; }

				node.left._skip = true;

				if ( flattened$1.keypath === 'module.exports' && node.right.type === 'ObjectExpression' ) {
					return node.right.properties.forEach( function (prop) {
						if ( prop.computed || prop.key.type !== 'Identifier' ) { return; }
						var name = prop.key.name;
						if ( name === makeLegalIdentifier( name ) ) { namedExports[ name ] = true; }
					});
				}

				if ( match[1] ) { namedExports[ match[1] ] = true; }
				return;
			}

			// if this is `var x = require('x')`, we can do `import x from 'x'`
			if ( node.type === 'VariableDeclarator' && node.id.type === 'Identifier' && isRequireStatement( node.init ) ) {
				// for now, only do this for top-level requires. maybe fix this in future
				if ( scope.parent ) { return; }

				// edge case — CJS allows you to assign to imports. ES doesn't
				if ( assignedTo.has( node.id.name ) ) { return; }

				var r$1 = getRequired( node.init, node.id.name );
				r$1.importsDefault = true;

				if ( r$1.name === node.id.name ) {
					node._shouldRemove = true;
				}
			}

			if ( !isRequireStatement( node ) ) { return; }

			var r = getRequired( node );

			if ( parent.type === 'ExpressionStatement' ) {
				// is a bare import, e.g. `require('foo');`
				magicString.remove( parent.start, parent.end );
			} else {
				r.importsDefault = true;
				magicString.overwrite( node.start, node.end, r.name );
			}

			node.callee._skip = true;
		},

		leave: function leave ( node ) {
			programDepth -= 1;
			if ( node.scope ) { scope = scope.parent; }
			if ( functionType.test( node.type ) ) { lexicalDepth -= 1; }

			if ( node.type === 'VariableDeclaration' ) {
				var keepDeclaration = false;
				var c = node.declarations[0].start;

				for ( var i = 0; i < node.declarations.length; i += 1 ) {
					var declarator = node.declarations[i];

					if ( declarator._shouldRemove ) {
						magicString.remove( c, declarator.end );
					} else {
						if ( !keepDeclaration ) {
							magicString.remove( c, declarator.start );
							keepDeclaration = true;
						}

						c = declarator.end;
					}
				}

				if ( !keepDeclaration ) {
					magicString.remove( node.start, node.end );
				}
			}
		}
	});

	if ( !sources.length && !uses.module && !uses.exports && !uses.require && ( ignoreGlobal || !uses.global ) ) {
		if ( Object.keys( namedExports ).length ) {
			throw new Error( ("Custom named exports were specified for " + id + " but it does not appear to be a CommonJS module") );
		}
		return null; // not a CommonJS module
	}

	var includeHelpers = shouldWrap || uses.global || uses.require;
	var importBlock = ( includeHelpers ? [ ("import * as " + HELPERS_NAME + " from '" + HELPERS_ID + "';") ] : [] ).concat(
		sources.map( function (source) {
			// import the actual module before the proxy, so that we know
			// what kind of proxy to build
			return ("import '" + source + "';");
		}),
		sources.map( function (source) {
			var ref = required[ source ];
			var name = ref.name;
			var importsDefault = ref.importsDefault;
			return ("import " + (importsDefault ? (name + " from ") : "") + "'" + PREFIX + source + "';");
		})
	).join( '\n' ) + '\n\n';

	var namedExportDeclarations = [];
	var wrapperStart = '';
	var wrapperEnd = '';

	var moduleName = deconflict( scope, globals, getName( id ) );
	if ( !isEntry ) {
		var exportModuleExports = {
			str: ("export { " + moduleName + " as __moduleExports };"),
			name: '__moduleExports'
		};

		namedExportDeclarations.push( exportModuleExports );
	}

	var name = getName( id );

	function addExport ( x ) {
		var deconflicted = deconflict( scope, globals, name );

		var declaration = deconflicted === name ?
			("export var " + x + " = " + moduleName + "." + x + ";") :
			("var " + deconflicted + " = " + moduleName + "." + x + ";\nexport { " + deconflicted + " as " + x + " };");

		namedExportDeclarations.push({
			str: declaration,
			name: x
		});
	}

	if ( customNamedExports ) { customNamedExports.forEach( addExport ); }

	var defaultExportPropertyAssignments = [];
	var hasDefaultExport = false;

	if ( shouldWrap ) {
		var args = "module" + (uses.exports ? ', exports' : '');

		wrapperStart = "var " + moduleName + " = " + HELPERS_NAME + ".createCommonjsModule(function (" + args + ") {\n";
		wrapperEnd = "\n});";
	} else {
		var names = [];

		ast.body.forEach( function (node) {
			if ( node.type === 'ExpressionStatement' && node.expression.type === 'AssignmentExpression' ) {
				var left = node.expression.left;
				var flattened = flatten( left );

				if ( !flattened ) { return; }

				var match = exportsPattern.exec( flattened.keypath );
				if ( !match ) { return; }

				if ( flattened.keypath === 'module.exports' ) {
					hasDefaultExport = true;
					magicString.overwrite( left.start, left.end, ("var " + moduleName) );
				} else {
					var name = match[1];
					var deconflicted = deconflict( scope, globals, name );

					names.push({ name: name, deconflicted: deconflicted });

					magicString.overwrite( node.start, left.end, ("var " + deconflicted) );

					var declaration = name === deconflicted ?
						("export { " + name + " };") :
						("export { " + deconflicted + " as " + name + " };");

					if ( name !== 'default' ) {
						namedExportDeclarations.push({
							str: declaration,
							name: name
						});
						delete namedExports[name];
					}

					defaultExportPropertyAssignments.push( (moduleName + "." + name + " = " + deconflicted + ";") );
				}
			}
		});

		if ( !hasDefaultExport ) {
			wrapperEnd = "\n\nvar " + moduleName + " = {\n" + (names.map( function (ref) {
					var name = ref.name;
					var deconflicted = ref.deconflicted;

					return ("\t" + name + ": " + deconflicted);
			} ).join( ',\n' )) + "\n};";
		}
	}
	Object.keys( namedExports )
		.filter( function (key) { return !blacklist[ key ]; } )
		.forEach( addExport );

	var defaultExport = /__esModule/.test( code ) ?
		("export default " + HELPERS_NAME + ".unwrapExports(" + moduleName + ");") :
		("export default " + moduleName + ";");

	var named = namedExportDeclarations
		.filter( function (x) { return x.name !== 'default' || !hasDefaultExport; } )
		.map( function (x) { return x.str; } );

	var exportBlock = '\n\n' + [ defaultExport ]
		.concat( named )
		.concat( hasDefaultExport ? defaultExportPropertyAssignments : [] )
		.join( '\n' );

	magicString.trim()
		.prepend( importBlock + wrapperStart )
		.trim()
		.append( wrapperEnd + exportBlock );

	code = magicString.toString();
	var map = sourceMap ? magicString.generateMap() : null;

	return { code: code, map: map };
}

function getCandidatesForExtension ( resolved, extension ) {
	return [
		resolved + extension,
		resolved + sep + "index" + extension
	];
}

function getCandidates ( resolved, extensions ) {
	return extensions.reduce(
		function ( paths, extension ) { return paths.concat( getCandidatesForExtension ( resolved, extension ) ); },
		[resolved]
	);
}

// Return the first non-falsy result from an array of
// maybe-sync, maybe-promise-returning functions
function first ( candidates ) {
	return function () {
		var args = [], len = arguments.length;
		while ( len-- ) args[ len ] = arguments[ len ];

		return candidates.reduce( function ( promise, candidate ) {
			return promise.then( function (result) { return result != null ?
				result :
				Promise.resolve( candidate.apply( void 0, args ) ); } );
		}, Promise.resolve() );
	};
}

function startsWith ( str, prefix ) {
	return str.slice( 0, prefix.length ) === prefix;
}


function commonjs ( options ) {
	if ( options === void 0 ) options = {};

	var extensions = options.extensions || ['.js'];
	var filter = createFilter( options.include, options.exclude );
	var ignoreGlobal = options.ignoreGlobal;

	var customNamedExports = {};
	if ( options.namedExports ) {
		Object.keys( options.namedExports ).forEach( function (id) {
			var resolvedId;

			try {
				resolvedId = sync( id, { basedir: process.cwd() });
			} catch ( err ) {
				resolvedId = resolve( id );
			}

			customNamedExports[ resolvedId ] = options.namedExports[ id ];
		});
	}

	var esModulesWithoutDefaultExport = [];

	var allowDynamicRequire = !!options.ignore; // TODO maybe this should be configurable?

	var ignoreRequire = typeof options.ignore === 'function' ?
		options.ignore :
		Array.isArray( options.ignore ) ? function (id) { return ~options.ignore.indexOf( id ); } :
			function () { return false; };

	var entryModuleIdsPromise = null;

	function resolveId ( importee, importer ) {
		if ( importee === HELPERS_ID ) { return importee; }

		if ( importer && startsWith( importer, PREFIX ) ) { importer = importer.slice( PREFIX.length ); }

		var isProxyModule = startsWith( importee, PREFIX );
		if ( isProxyModule ) { importee = importee.slice( PREFIX.length ); }

		return resolveUsingOtherResolvers( importee, importer ).then( function (resolved) {
			if ( resolved ) { return isProxyModule ? PREFIX + resolved : resolved; }

			resolved = defaultResolver( importee, importer );

			if ( isProxyModule ) {
				if ( resolved ) { return PREFIX + resolved; }
				return EXTERNAL + importee; // external
			}

			return resolved;
		});
	}

	var sourceMap = options.sourceMap !== false;

	var resolveUsingOtherResolvers;

	var isCjsPromises = Object.create(null);
	function getIsCjsPromise ( id ) {
		var isCjsPromise = isCjsPromises[id];
		if (isCjsPromise)
			{ return isCjsPromise.promise; }

		var promise = new Promise( function (resolve$$1) {
			isCjsPromises[id] = isCjsPromise = {
				resolve: resolve$$1,
				promise: undefined
			};
		});
		isCjsPromise.promise = promise;

		return promise;
	}
	function setIsCjsPromise ( id, promise ) {
		var isCjsPromise = isCjsPromises[id];
		if (isCjsPromise) {
			if (isCjsPromise.resolve) {
				isCjsPromise.resolve(promise);
				isCjsPromise.resolve = undefined;
			}
		}
		else {
			isCjsPromises[id] = { promise: promise, resolve: undefined };
		}
	}

	return {
		name: 'commonjs',

		options: function options ( options$1 ) {
			var resolvers = ( options$1.plugins || [] )
				.map( function (plugin) {
					if ( plugin.resolveId === resolveId ) {
						// substitute CommonJS resolution logic
						return function ( importee, importer ) {
							if ( importee[0] !== '.' || !importer ) { return; } // not our problem

							var resolved = resolve( dirname( importer ), importee );
							var candidates = getCandidates( resolved, extensions );

							for ( var i = 0; i < candidates.length; i += 1 ) {
								try {
									var stats = statSync( candidates[i] );
									if ( stats.isFile() ) { return candidates[i]; }
								} catch ( err ) { /* noop */ }
							}
						};
					}

					return plugin.resolveId;
				})
				.filter( Boolean );

			var isExternal = function (id) { return options$1.external ?
				Array.isArray( options$1.external ) ? ~options$1.external.indexOf( id ) :
					options$1.external(id) :
				false; };

			resolvers.unshift( function (id) { return isExternal( id ) ? false : null; } );

			resolveUsingOtherResolvers = first( resolvers );

			var entryModules = [].concat( options$1.input || options$1.entry );
			entryModuleIdsPromise = Promise.all(
				entryModules.map( function (entry) { return resolveId( entry ); })
			);
		},

		resolveId: resolveId,

		load: function load ( id ) {
			if ( id === HELPERS_ID ) { return HELPERS; }

			// generate proxy modules
			if ( startsWith( id, EXTERNAL ) ) {
				var actualId = id.slice( EXTERNAL.length );
				var name = getName( actualId );

				return ("import " + name + " from " + (JSON.stringify( actualId )) + "; export default " + name + ";");
			}

			if ( startsWith( id, PREFIX ) ) {
				var actualId$1 = id.slice( PREFIX.length );
				var name$1 = getName( actualId$1 );

				return ( ( extensions.indexOf( extname( id ) ) === -1 ) ? Promise.resolve(false) : getIsCjsPromise( actualId$1 ) )
					.then( function (isCjs) {
						if ( isCjs )
							{ return ("import { __moduleExports } from " + (JSON.stringify( actualId$1 )) + "; export default __moduleExports;"); }
						else if (esModulesWithoutDefaultExport.indexOf(actualId$1) !== -1)
							{ return ("import * as " + name$1 + " from " + (JSON.stringify( actualId$1 )) + "; export default " + name$1 + ";"); }
						else
							{ return ("import * as " + name$1 + " from " + (JSON.stringify( actualId$1 )) + "; export default ( " + name$1 + " && " + name$1 + "['default'] ) || " + name$1 + ";"); }
					});
			}
		},

		transform: function transform ( code, id ) {
			var this$1 = this;

			if ( !filter( id ) ) { return null; }
			if ( extensions.indexOf( extname( id ) ) === -1 ) { return null; }

			var transformPromise = entryModuleIdsPromise.then( function (entryModuleIds) {
				var ref = checkEsModule( this$1.parse, code, id );
				var isEsModule = ref.isEsModule;
				var hasDefaultExport = ref.hasDefaultExport;
				var ast = ref.ast;
				if ( isEsModule ) {
					if ( !hasDefaultExport )
						{ esModulesWithoutDefaultExport.push( id ); }
					return;
				}

				// it is not an ES module but not a commonjs module, too.
				if ( !checkFirstpass( code, ignoreGlobal ) ) {
					esModulesWithoutDefaultExport.push( id );
					return;
				}

				var transformed = transformCommonjs( this$1.parse, code, id, entryModuleIds.indexOf(id) !== -1, ignoreGlobal, ignoreRequire, customNamedExports[ id ], sourceMap, allowDynamicRequire, ast );
				if ( !transformed ) {
					esModulesWithoutDefaultExport.push( id );
					return;
				}

				return transformed;
			}).catch(function (err) {
				this$1.error(err, err.loc);
			});

			setIsCjsPromise(id, transformPromise.then( function (transformed) { return transformed ? true : false; }, function () { return true; } ));

			return transformPromise;
		}
	};
}

export default commonjs;
//# sourceMappingURL=rollup-plugin-commonjs.es.js.map
