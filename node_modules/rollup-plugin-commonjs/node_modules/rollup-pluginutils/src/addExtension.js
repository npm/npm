import { extname } from 'path';

export default function addExtension ( filename, ext = '.js' ) {
	if ( !extname( filename ) ) filename += ext;
	return filename;
}
