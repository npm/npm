import { walk } from 'estree-walker';

const blockDeclarations = {
	'const': true,
	'let': true
};

const extractors = {
	Identifier ( names, param ) {
		names.push( param.name );
	},

	ObjectPattern ( names, param ) {
		param.properties.forEach( prop => {
			extractors[ prop.key.type ]( names, prop.key );
		});
	},

	ArrayPattern ( names, param ) {
		param.elements.forEach( element => {
			if ( element ) extractors[ element.type ]( names, element );
		});
	},

	RestElement ( names, param ) {
		extractors[ param.argument.type ]( names, param.argument );
	},

	AssignmentPattern ( names, param ) {
		return extractors[ param.left.type ]( names, param.left );
	}
};

function extractNames ( param ) {
	let names = [];

	extractors[ param.type ]( names, param );
	return names;
}

class Scope {
	constructor ( options ) {
		options = options || {};

		this.parent = options.parent;
		this.isBlockScope = !!options.block;

		this.declarations = Object.create( null );

		if ( options.params ) {
			options.params.forEach( param => {
				extractNames( param ).forEach( name => {
					this.declarations[ name ] = true;
				});
			});
		}
	}

	addDeclaration ( node, isBlockDeclaration, isVar ) {
		if ( !isBlockDeclaration && this.isBlockScope ) {
			// it's a `var` or function node, and this
			// is a block scope, so we need to go up
			this.parent.addDeclaration( node, isBlockDeclaration, isVar );
		} else {
			extractNames( node.id ).forEach( name => {
				this.declarations[ name ] = true;
			});
		}
	}

	contains ( name ) {
		return this.declarations[ name ] ||
		       ( this.parent ? this.parent.contains( name ) : false );
	}
}


export default function attachScopes ( ast, propertyName = 'scope' ) {
	let scope = new Scope();

	walk( ast, {
		enter ( node, parent ) {
			// function foo () {...}
			// class Foo {...}
			if ( /(Function|Class)Declaration/.test( node.type ) ) {
				scope.addDeclaration( node, false, false );
			}

			// var foo = 1
			if ( node.type === 'VariableDeclaration' ) {
				const isBlockDeclaration = blockDeclarations[ node.kind ];

				node.declarations.forEach( declaration => {
					scope.addDeclaration( declaration, isBlockDeclaration, true );
				});
			}

			let newScope;

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
		leave ( node ) {
			if ( node[ propertyName ] ) scope = scope.parent;
		}
	});

	return scope;
}
