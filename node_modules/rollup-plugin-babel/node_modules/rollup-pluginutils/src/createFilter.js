import { resolve, sep } from 'path';
import { Minimatch } from 'minimatch';
import ensureArray from './utils/ensureArray';

export default function createFilter ( include, exclude ) {
	include = ensureArray( include ).map( id => resolve( id ) ).map( id => new Minimatch(id) );
	exclude = ensureArray( exclude ).map( id => resolve( id ) ).map( id => new Minimatch(id) );

	return function ( id ) {
		if ( typeof id !== 'string' ) return false;
		if ( /\0/.test( id ) ) return false;

		let included = !include.length;
		id = id.split(sep).join('/');

		include.forEach( minimatch => {
			if ( minimatch.match( id ) ) included = true;
		});

		exclude.forEach( minimatch => {
			if ( minimatch.match( id ) ) included = false;
		});

		return included;
	};
}
