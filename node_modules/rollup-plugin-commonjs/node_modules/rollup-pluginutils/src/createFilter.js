import { resolve, sep } from 'path';
import mm from 'micromatch';
import ensureArray from './utils/ensureArray';

export default function createFilter ( include, exclude ) {
	const getMatcher = id => ( isRegexp( id ) ? id : { test: mm.matcher( resolve( id ) ) } );
	include = ensureArray( include ).map( getMatcher );
	exclude = ensureArray( exclude ).map( getMatcher );

	return function ( id ) {

		if ( typeof id !== 'string' ) return false;
		if ( /\0/.test( id ) ) return false;

		id = id.split( sep ).join( '/' );

		for ( let i = 0; i < exclude.length; ++i ) {
			const matcher = exclude[i];
			if ( matcher.test( id ) ) return false;
		}

		for ( let i = 0; i < include.length; ++i ) {
			const matcher = include[i];
			if ( matcher.test( id ) ) return true;
		}

		return !include.length;
	};
}

function isRegexp ( val ) {
	return val instanceof RegExp;
}
