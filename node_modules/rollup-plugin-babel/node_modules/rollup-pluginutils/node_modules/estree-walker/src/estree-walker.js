export function walk ( ast, { enter, leave }) {
	visit( ast, null, enter, leave );
}

const context = {
	skip: () => context.shouldSkip = true,
	shouldSkip: false
};

let childKeys = {};

const toString = Object.prototype.toString;

function isArray ( thing ) {
	return toString.call( thing ) === '[object Array]';
}

function visit ( node, parent, enter, leave, prop, index ) {
	if ( !node ) return;

	if ( enter ) {
		context.shouldSkip = false;
		enter.call( context, node, parent, prop, index );
		if ( context.shouldSkip ) return;
	}

	const keys = childKeys[ node.type ] || (
		childKeys[ node.type ] = Object.keys( node ).filter( key => typeof node[ key ] === 'object' )
	);

	let key, value, i, j;

	i = keys.length;
	while ( i-- ) {
		key = keys[i];
		value = node[ key ];

		if ( isArray( value ) ) {
			j = value.length;
			while ( j-- ) {
				visit( value[j], node, enter, leave, key, j );
			}
		}

		else if ( value && value.type ) {
			visit( value, node, enter, leave, key, null );
		}
	}

	if ( leave ) {
		leave( node, parent, prop, index );
	}
}
