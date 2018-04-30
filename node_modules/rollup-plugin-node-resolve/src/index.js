import { dirname, resolve, extname, normalize, sep } from 'path';
import builtins from 'builtin-modules';
import resolveId from 'resolve';
import isModule from 'is-module';
import fs from 'fs';

const ES6_BROWSER_EMPTY = resolve( __dirname, '../src/empty.js' );
const CONSOLE_WARN = ( ...args ) => console.warn( ...args ); // eslint-disable-line no-console
const exts = [ '.js', '.json', '.node' ];

let readFileCache = {};
const readFileAsync = file => new Promise((fulfil, reject) => fs.readFile(file, (err, contents) => err ? reject(err) : fulfil(contents)));
const statAsync = file => new Promise((fulfil, reject) => fs.stat(file, (err, contents) => err ? reject(err) : fulfil(contents)));
function cachedReadFile (file, cb) {
	if (file in readFileCache === false) {
		readFileCache[file] = readFileAsync(file).catch(err => {
			delete readFileCache[file];
			throw err;
		});
	}
	readFileCache[file].then(contents => cb(null, contents), cb);
}

let isFileCache = {};
function cachedIsFile (file, cb) {
	if (file in isFileCache === false) {
		isFileCache[file] = statAsync(file)
			.then(
				stat => stat.isFile(),
				err => {
					if (err.code == 'ENOENT') return false;
					delete isFileCache[file];
					throw err;
				});
	}
	isFileCache[file].then(contents => cb(null, contents), cb);
}

export default function nodeResolve ( options = {} ) {
	const useModule = options.module !== false;
	const useMain = options.main !== false;
	const useJsnext = options.jsnext === true;
	const isPreferBuiltinsSet = options.preferBuiltins === true || options.preferBuiltins === false;
	const preferBuiltins = isPreferBuiltinsSet ? options.preferBuiltins : true;
	const customResolveOptions = options.customResolveOptions || {};
	const jail = options.jail;
	const only = Array.isArray(options.only)
		? options.only.map(o => o instanceof RegExp
			? o
			: new RegExp('^' + String(o).replace(/[\\^$*+?.()|[\]{}]/g, '\\$&') + '$')
		)
		: null;
	const browserMapCache = {};

	const onwarn = options.onwarn || CONSOLE_WARN;

	if ( options.skip ) {
		throw new Error( 'options.skip is no longer supported — you should use the main Rollup `external` option instead' );
	}

	if ( !useModule && !useMain && !useJsnext ) {
		throw new Error( `At least one of options.module, options.main or options.jsnext must be true` );
	}

	let preserveSymlinks;

	return {
		name: 'node-resolve',

		options ( options ) {
			preserveSymlinks = options.preserveSymlinks;
		},

		onwrite () {
			isFileCache = {};
			readFileCache = {};
		},

		resolveId ( importee, importer ) {
			if ( /\0/.test( importee ) ) return null; // ignore IDs with null character, these belong to other plugins

			// disregard entry module
			if ( !importer ) return null;

			if (options.browser && browserMapCache[importer]) {
				const resolvedImportee = resolve( dirname( importer ), importee );
				const browser = browserMapCache[importer];
				if (browser[importee] === false || browser[resolvedImportee] === false) {
					return ES6_BROWSER_EMPTY;
				}
				if (browser[importee] || browser[resolvedImportee] || browser[resolvedImportee + '.js'] || browser[resolvedImportee + '.json']) {
					importee = browser[importee] || browser[resolvedImportee] || browser[resolvedImportee + '.js'] || browser[resolvedImportee + '.json'];
				}
			}


			const parts = importee.split( /[/\\]/ );
			let id = parts.shift();

			if ( id[0] === '@' && parts.length ) {
				// scoped packages
				id += `/${parts.shift()}`;
			} else if ( id[0] === '.' ) {
				// an import relative to the parent dir of the importer
				id = resolve( importer, '..', importee );
			}

			if (only && !only.some(pattern => pattern.test(id))) return null;

			return new Promise( ( fulfil, reject ) => {
				let disregardResult = false;
				let packageBrowserField = false;

				const resolveOptions = {
					basedir: dirname( importer ),
					packageFilter ( pkg, pkgPath ) {
						const pkgRoot = dirname( pkgPath );
						if (options.browser && typeof pkg[ 'browser' ] === 'object') {
							packageBrowserField = Object.keys(pkg[ 'browser' ]).reduce((browser, key) => {
								const resolved = pkg[ 'browser' ][ key ] === false ? false : resolve( pkgRoot, pkg[ 'browser' ][ key ] );
								browser[ key ] = resolved;
								if ( key[0] === '.' ) {
									const absoluteKey = resolve( pkgRoot, key );
									browser[ absoluteKey ] = resolved;
									if ( !extname(key) ) {
										exts.reduce( ( browser, ext ) => {
											browser[ absoluteKey + ext ] = browser[ key ];
											return browser;
										}, browser );
									}
								}
								return browser;
							}, {});
						}

						if (options.browser && typeof pkg[ 'browser' ] === 'string') {
							pkg[ 'main' ] = pkg[ 'browser' ];
						} else if ( useModule && pkg[ 'module' ] ) {
							pkg[ 'main' ] = pkg[ 'module' ];
						} else if ( useJsnext && pkg[ 'jsnext:main' ] ) {
							pkg[ 'main' ] = pkg[ 'jsnext:main' ];
						} else if ( ( useJsnext || useModule ) && !useMain ) {
							disregardResult = true;
						}
						return pkg;
					},
					readFile: cachedReadFile,
					isFile: cachedIsFile,
					extensions: options.extensions
				};

				if (preserveSymlinks !== undefined) {
					resolveOptions.preserveSymlinks = preserveSymlinks;
				}

				resolveId(
					importee,
					Object.assign( resolveOptions, customResolveOptions ),
					( err, resolved ) => {
						if (options.browser && packageBrowserField) {
							if (packageBrowserField[ resolved ]) {
								resolved = packageBrowserField[ resolved ];
							}
							browserMapCache[resolved] = packageBrowserField;
						}

						if ( !disregardResult && !err ) {
							if ( !preserveSymlinks && resolved && fs.existsSync( resolved ) ) {
								resolved = fs.realpathSync( resolved );
							}

							if ( ~builtins.indexOf( resolved ) ) {
								fulfil( null );
							} else if ( ~builtins.indexOf( importee ) && preferBuiltins ) {
								if ( !isPreferBuiltinsSet ) {
									onwarn(
										`preferring built-in module '${importee}' over local alternative ` +
										`at '${resolved}', pass 'preferBuiltins: false' to disable this ` +
										`behavior or 'preferBuiltins: true' to disable this warning`
									);
								}
								fulfil( null );
							} else if ( jail && resolved.indexOf( normalize( jail.trim( sep ) ) ) !== 0 ) {
								fulfil( null );
							}
						}

						if ( resolved && options.modulesOnly ) {
							fs.readFile( resolved, 'utf-8', ( err, code ) => {
								if ( err ) {
									reject( err );
								} else {
									const valid = isModule( code );
									fulfil( valid ? resolved : null );
								}
							});
						} else {
							fulfil( resolved );
						}
					}
				);
			});
		}
	};
}
