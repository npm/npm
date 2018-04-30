let warned = {};
export function warnOnce ( warn, msg ) {
	if ( warned[ msg ] ) return;
	warned[ msg ] = true;
	warn( msg );
}
