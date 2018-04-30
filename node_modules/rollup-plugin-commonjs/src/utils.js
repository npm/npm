import { basename, extname, dirname, sep } from 'path';
import { makeLegalIdentifier } from 'rollup-pluginutils';

export function getName ( id ) {
	const name = makeLegalIdentifier( basename( id, extname( id ) ) );
	if (name !== 'index') {
		return name;
	} else {
		const segments = dirname( id ).split( sep );
		return makeLegalIdentifier( segments[segments.length - 1] );
	}
}

