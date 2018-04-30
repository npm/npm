function basename ( path ) {
	return path.split( /(\/|\\)/ ).pop();
}

function extname ( path ) {
	const match = /\.[^\.]+$/.exec( basename( path ) );
	if ( !match ) return '';
	return match[0];
}

export default function addExtension ( filename, ext = '.js' ) {
	if ( !extname( filename ) ) filename += ext;
	return filename;
}
