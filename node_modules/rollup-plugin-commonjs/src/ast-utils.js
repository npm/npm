export function isReference ( node, parent ) {
	if ( parent.type === 'MemberExpression' ) return parent.computed || node === parent.object;

	// disregard the `bar` in { bar: foo }
	if ( parent.type === 'Property' && node !== parent.value ) return false;

	// disregard the `bar` in `class Foo { bar () {...} }`
	if ( parent.type === 'MethodDefinition' ) return false;

	// disregard the `bar` in `export { foo as bar }`
	if ( parent.type === 'ExportSpecifier' && node !== parent.local ) return false;

	return true;
}

export function flatten ( node ) {
	const parts = [];

	while ( node.type === 'MemberExpression' ) {
		if ( node.computed ) return null;

		parts.unshift( node.property.name );
		node = node.object;
	}

	if ( node.type !== 'Identifier' ) return null;

	const name = node.name;
	parts.unshift( name );

	return { name, keypath: parts.join( '.' ) };
}

export function extractNames ( node ) {
	const names = [];
	extractors[ node.type ]( names, node );
	return names;
}

const extractors = {
	Identifier ( names, node ) {
		names.push( node.name );
	},

	ObjectPattern ( names, node ) {
		node.properties.forEach( prop => {
			extractors[ prop.value.type ]( names, prop.value );
		});
	},

	ArrayPattern ( names, node ) {
		node.elements.forEach( element => {
			if ( element ) extractors[ element.type ]( names, element );
		});
	},

	RestElement ( names, node ) {
		extractors[ node.argument.type ]( names, node.argument );
	},

	AssignmentPattern ( names, node ) {
		extractors[ node.left.type ]( names, node.left );
	}
};


export function isTruthy ( node ) {
	if ( node.type === 'Literal' ) return !!node.value;
	if ( node.type === 'ParenthesizedExpression' ) return isTruthy( node.expression );
	if ( node.operator in operators ) return operators[ node.operator ]( node );
}

export function isFalsy ( node ) {
	return not( isTruthy( node ) );
}

function not ( value ) {
	return value === undefined ? value : !value;
}

function equals ( a, b, strict ) {
	if ( a.type !== b.type ) return undefined;
	if ( a.type === 'Literal' ) return strict ? a.value === b.value : a.value == b.value;
}

const operators = {
	'==': x => {
		return equals( x.left, x.right, false );
	},

	'!=': x => not( operators['==']( x ) ),

	'===': x => {
		return equals( x.left, x.right, true );
	},

	'!==': x => not( operators['===']( x ) ),

	'!': x => isFalsy( x.argument ),

	'&&': x => isTruthy( x.left ) && isTruthy( x.right ),

	'||': x => isTruthy( x.left ) || isTruthy( x.right )
};
