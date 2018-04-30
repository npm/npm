import * as fs from 'fs';
import { dirname, resolve } from 'path';

function isFile ( file ) {
	try {
		const stats = fs.statSync( file );
		return stats.isFile();
	} catch ( err ) {
		return false;
	}
}

function addJsExtensionIfNecessary ( file ) {
	if ( isFile( file ) ) return file;

	file += '.js';
	if ( isFile( file ) ) return file;

	return null;
}

const absolutePath = /^(?:\/|(?:[A-Za-z]:)?[\\|/])/;

function isAbsolute ( path ) {
	return absolutePath.test( path );
}

export default function defaultResolver ( importee, importer ) {
	// absolute paths are left untouched
	if ( isAbsolute( importee ) ) return addJsExtensionIfNecessary( resolve( importee ) );

	// if this is the entry point, resolve against cwd
	if ( importer === undefined ) return addJsExtensionIfNecessary( resolve( process.cwd(), importee ) );

	// external modules are skipped at this stage
	if ( importee[0] !== '.' ) return null;

	return addJsExtensionIfNecessary( resolve( dirname( importer ), importee ) );
}
