'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var estreeWalker = require('estree-walker');
var path = require('path');
var minimatch = require('minimatch');

function basename ( path ) {
	return path.split( /(\/|\\)/ ).pop();
}

function extname ( path ) {
	var match = /\.[^\.]+$/.exec( basename( path ) );
	if ( !match ) return '';
	return match[0];
}

function addExtension ( filename, ext ) {
	if ( ext === void 0 ) ext = '.js';

	if ( !extname( filename ) ) filename += ext;
	return filename;
}

var blockDeclarations = {
	'const': true,
	'let': true
};

var extractors = {
	Identifier: function Identifier ( names, param ) {
		names.push( param.name );
	},

	ObjectPattern: function ObjectPattern ( names, param ) {
		param.properties.forEach( function (prop) {
			extractors[ prop.key.type ]( names, prop.key );
		});
	},

	ArrayPattern: function ArrayPattern ( names, param ) {
		param.elements.forEach( function (element) {
			if ( element ) extractors[ element.type ]( names, element );
		});
	},

	RestElement: function RestElement ( names, param ) {
		extractors[ param.argument.type ]( names, param.argument );
	},

	AssignmentPattern: function AssignmentPattern ( names, param ) {
		return extractors[ param.left.type ]( names, param.left );
	}
};

function extractNames ( param ) {
	var names = [];

	extractors[ param.type ]( names, param );
	return names;
}

var Scope = function Scope ( options ) {
	var this$1 = this;

	options = options || {};

	this.parent = options.parent;
	this.isBlockScope = !!options.block;

	this.declarations = Object.create( null );

	if ( options.params ) {
		options.params.forEach( function (param) {
			extractNames( param ).forEach( function (name) {
				this$1.declarations[ name ] = true;
			});
		});
	}
};

Scope.prototype.addDeclaration = function addDeclaration ( node, isBlockDeclaration, isVar ) {
		var this$1 = this;

	if ( !isBlockDeclaration && this.isBlockScope ) {
		// it's a `var` or function node, and this
		// is a block scope, so we need to go up
		this.parent.addDeclaration( node, isBlockDeclaration, isVar );
	} else {
		extractNames( node.id ).forEach( function (name) {
			this$1.declarations[ name ] = true;
		});
	}
};

Scope.prototype.contains = function contains ( name ) {
	return this.declarations[ name ] ||
		       ( this.parent ? this.parent.contains( name ) : false );
};


function attachScopes ( ast, propertyName ) {
	if ( propertyName === void 0 ) propertyName = 'scope';

	var scope = new Scope();

	estreeWalker.walk( ast, {
		enter: function enter ( node, parent ) {
			// function foo () {...}
			// class Foo {...}
			if ( /(Function|Class)Declaration/.test( node.type ) ) {
				scope.addDeclaration( node, false, false );
			}

			// var foo = 1
			if ( node.type === 'VariableDeclaration' ) {
				var isBlockDeclaration = blockDeclarations[ node.kind ];

				node.declarations.forEach( function (declaration) {
					scope.addDeclaration( declaration, isBlockDeclaration, true );
				});
			}

			var newScope;

			// create new function scope
			if ( /Function/.test( node.type ) ) {
				newScope = new Scope({
					parent: scope,
					block: false,
					params: node.params
				});

				// named function expressions - the name is considered
				// part of the function's scope
				if ( node.type === 'FunctionExpression' && node.id ) {
					newScope.addDeclaration( node, false, false );
				}
			}

			// create new block scope
			if ( node.type === 'BlockStatement' && !/Function/.test( parent.type ) ) {
				newScope = new Scope({
					parent: scope,
					block: true
				});
			}

			// catch clause has its own block scope
			if ( node.type === 'CatchClause' ) {
				newScope = new Scope({
					parent: scope,
					params: [ node.param ],
					block: true
				});
			}

			if ( newScope ) {
				Object.defineProperty( node, propertyName, {
					value: newScope,
					configurable: true
				});

				scope = newScope;
			}
		},
		leave: function leave ( node ) {
			if ( node[ propertyName ] ) scope = scope.parent;
		}
	});

	return scope;
}

function ensureArray ( thing ) {
	if ( Array.isArray( thing ) ) return thing;
	if ( thing == undefined ) return [];
	return [ thing ];
}

function createFilter ( include, exclude ) {
	include = ensureArray( include ).map( function (id) { return path.resolve( id ); } ).map( function (id) { return new minimatch.Minimatch(id); } );
	exclude = ensureArray( exclude ).map( function (id) { return path.resolve( id ); } ).map( function (id) { return new minimatch.Minimatch(id); } );

	return function ( id ) {
		if ( typeof id !== 'string' ) return false;
		if ( /\0/.test( id ) ) return false;

		var included = !include.length;
		id = id.split(path.sep).join('/');

		include.forEach( function (minimatch) {
			if ( minimatch.match( id ) ) included = true;
		});

		exclude.forEach( function (minimatch) {
			if ( minimatch.match( id ) ) included = false;
		});

		return included;
	};
}

var reservedWords = 'break case class catch const continue debugger default delete do else export extends finally for function if import in instanceof let new return super switch this throw try typeof var void while with yield enum await implements package protected static interface private public'.split( ' ' );
var builtins = 'arguments Infinity NaN undefined null true false eval uneval isFinite isNaN parseFloat parseInt decodeURI decodeURIComponent encodeURI encodeURIComponent escape unescape Object Function Boolean Symbol Error EvalError InternalError RangeError ReferenceError SyntaxError TypeError URIError Number Math Date String RegExp Array Int8Array Uint8Array Uint8ClampedArray Int16Array Uint16Array Int32Array Uint32Array Float32Array Float64Array Map Set WeakMap WeakSet SIMD ArrayBuffer DataView JSON Promise Generator GeneratorFunction Reflect Proxy Intl'.split( ' ' );

var blacklisted = Object.create( null );
reservedWords.concat( builtins ).forEach( function (word) { return blacklisted[ word ] = true; } );

function makeLegalIdentifier ( str ) {
	str = str
		.replace( /-(\w)/g, function ( _, letter ) { return letter.toUpperCase(); } )
		.replace( /[^$_a-zA-Z0-9]/g, '_' );

	if ( /\d/.test( str[0] ) || blacklisted[ str ] ) str = "_" + str;

	return str;
}

exports.addExtension = addExtension;
exports.attachScopes = attachScopes;
exports.createFilter = createFilter;
exports.makeLegalIdentifier = makeLegalIdentifier;