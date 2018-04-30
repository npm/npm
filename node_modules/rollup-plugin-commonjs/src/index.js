import { statSync } from 'fs';
import { dirname, extname, resolve, sep } from 'path';
import { sync as nodeResolveSync } from 'resolve';
import { createFilter } from 'rollup-pluginutils';
import { EXTERNAL, PREFIX, HELPERS_ID, HELPERS } from './helpers.js';
import defaultResolver from './defaultResolver.js';
import { checkFirstpass, checkEsModule, transformCommonjs } from './transform.js';
import { getName } from './utils.js';

function getCandidatesForExtension ( resolved, extension ) {
	return [
		resolved + extension,
		resolved + `${sep}index${extension}`
	];
}

function getCandidates ( resolved, extensions ) {
	return extensions.reduce(
		( paths, extension ) => paths.concat( getCandidatesForExtension ( resolved, extension ) ),
		[resolved]
	);
}

// Return the first non-falsy result from an array of
// maybe-sync, maybe-promise-returning functions
function first ( candidates ) {
	return function ( ...args ) {
		return candidates.reduce( ( promise, candidate ) => {
			return promise.then( result => result != null ?
				result :
				Promise.resolve( candidate( ...args ) ) );
		}, Promise.resolve() );
	};
}

function startsWith ( str, prefix ) {
	return str.slice( 0, prefix.length ) === prefix;
}


export default function commonjs ( options = {} ) {
	const extensions = options.extensions || ['.js'];
	const filter = createFilter( options.include, options.exclude );
	const ignoreGlobal = options.ignoreGlobal;

	const customNamedExports = {};
	if ( options.namedExports ) {
		Object.keys( options.namedExports ).forEach( id => {
			let resolvedId;

			try {
				resolvedId = nodeResolveSync( id, { basedir: process.cwd() });
			} catch ( err ) {
				resolvedId = resolve( id );
			}

			customNamedExports[ resolvedId ] = options.namedExports[ id ];
		});
	}

	const esModulesWithoutDefaultExport = [];

	const allowDynamicRequire = !!options.ignore; // TODO maybe this should be configurable?

	const ignoreRequire = typeof options.ignore === 'function' ?
		options.ignore :
		Array.isArray( options.ignore ) ? id => ~options.ignore.indexOf( id ) :
			() => false;

	let entryModuleIdsPromise = null;

	function resolveId ( importee, importer ) {
		if ( importee === HELPERS_ID ) return importee;

		if ( importer && startsWith( importer, PREFIX ) ) importer = importer.slice( PREFIX.length );

		const isProxyModule = startsWith( importee, PREFIX );
		if ( isProxyModule ) importee = importee.slice( PREFIX.length );

		return resolveUsingOtherResolvers( importee, importer ).then( resolved => {
			if ( resolved ) return isProxyModule ? PREFIX + resolved : resolved;

			resolved = defaultResolver( importee, importer );

			if ( isProxyModule ) {
				if ( resolved ) return PREFIX + resolved;
				return EXTERNAL + importee; // external
			}

			return resolved;
		});
	}

	const sourceMap = options.sourceMap !== false;

	let resolveUsingOtherResolvers;

	const isCjsPromises = Object.create(null);
	function getIsCjsPromise ( id ) {
		let isCjsPromise = isCjsPromises[id];
		if (isCjsPromise)
			return isCjsPromise.promise;

		const promise = new Promise( resolve => {
			isCjsPromises[id] = isCjsPromise = {
				resolve: resolve,
				promise: undefined
			};
		});
		isCjsPromise.promise = promise;

		return promise;
	}
	function setIsCjsPromise ( id, promise ) {
		const isCjsPromise = isCjsPromises[id];
		if (isCjsPromise) {
			if (isCjsPromise.resolve) {
				isCjsPromise.resolve(promise);
				isCjsPromise.resolve = undefined;
			}
		}
		else {
			isCjsPromises[id] = { promise: promise, resolve: undefined };
		}
	}

	return {
		name: 'commonjs',

		options ( options ) {
			const resolvers = ( options.plugins || [] )
				.map( plugin => {
					if ( plugin.resolveId === resolveId ) {
						// substitute CommonJS resolution logic
						return ( importee, importer ) => {
							if ( importee[0] !== '.' || !importer ) return; // not our problem

							const resolved = resolve( dirname( importer ), importee );
							const candidates = getCandidates( resolved, extensions );

							for ( let i = 0; i < candidates.length; i += 1 ) {
								try {
									const stats = statSync( candidates[i] );
									if ( stats.isFile() ) return candidates[i];
								} catch ( err ) { /* noop */ }
							}
						};
					}

					return plugin.resolveId;
				})
				.filter( Boolean );

			const isExternal = id => options.external ?
				Array.isArray( options.external ) ? ~options.external.indexOf( id ) :
					options.external(id) :
				false;

			resolvers.unshift( id => isExternal( id ) ? false : null );

			resolveUsingOtherResolvers = first( resolvers );

			const entryModules = [].concat( options.input || options.entry );
			entryModuleIdsPromise = Promise.all(
				entryModules.map( entry => resolveId( entry ))
			);
		},

		resolveId,

		load ( id ) {
			if ( id === HELPERS_ID ) return HELPERS;

			// generate proxy modules
			if ( startsWith( id, EXTERNAL ) ) {
				const actualId = id.slice( EXTERNAL.length );
				const name = getName( actualId );

				return `import ${name} from ${JSON.stringify( actualId )}; export default ${name};`;
			}

			if ( startsWith( id, PREFIX ) ) {
				const actualId = id.slice( PREFIX.length );
				const name = getName( actualId );

				return ( ( extensions.indexOf( extname( id ) ) === -1 ) ? Promise.resolve(false) : getIsCjsPromise( actualId ) )
					.then( isCjs => {
						if ( isCjs )
							return `import { __moduleExports } from ${JSON.stringify( actualId )}; export default __moduleExports;`;
						else if (esModulesWithoutDefaultExport.indexOf(actualId) !== -1)
							return `import * as ${name} from ${JSON.stringify( actualId )}; export default ${name};`;
						else
							return `import * as ${name} from ${JSON.stringify( actualId )}; export default ( ${name} && ${name}['default'] ) || ${name};`;
					});
			}
		},

		transform ( code, id ) {
			if ( !filter( id ) ) return null;
			if ( extensions.indexOf( extname( id ) ) === -1 ) return null;

			const transformPromise = entryModuleIdsPromise.then( (entryModuleIds) => {
				const {isEsModule, hasDefaultExport, ast} = checkEsModule( this.parse, code, id );
				if ( isEsModule ) {
					if ( !hasDefaultExport )
						esModulesWithoutDefaultExport.push( id );
					return;
				}

				// it is not an ES module but not a commonjs module, too.
				if ( !checkFirstpass( code, ignoreGlobal ) ) {
					esModulesWithoutDefaultExport.push( id );
					return;
				}

				const transformed = transformCommonjs( this.parse, code, id, entryModuleIds.indexOf(id) !== -1, ignoreGlobal, ignoreRequire, customNamedExports[ id ], sourceMap, allowDynamicRequire, ast );
				if ( !transformed ) {
					esModulesWithoutDefaultExport.push( id );
					return;
				}

				return transformed;
			}).catch(err => {
				this.error(err, err.loc);
			});

			setIsCjsPromise(id, transformPromise.then( transformed => transformed ? true : false, () => true ));

			return transformPromise;
		}
	};
}
