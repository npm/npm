(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.estreeWalker = global.estreeWalker || {})));
}(this, function (exports) { 'use strict';

	function walk ( ast, ref) {
		var enter = ref.enter;
		var leave = ref.leave;

		visit( ast, null, enter, leave );
	}

	var context = {
		skip: function () { return context.shouldSkip = true; },
		shouldSkip: false
	};

	var childKeys = {};

	var toString = Object.prototype.toString;

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

		var keys = childKeys[ node.type ] || (
			childKeys[ node.type ] = Object.keys( node ).filter( function ( key ) { return typeof node[ key ] === 'object'; } )
		);

		var key, value, i, j;

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

	exports.walk = walk;

}));
//# sourceMappingURL=estree-walker.umd.js.map