import { dirname } from 'path';
import { buildExternalHelpers, transform } from 'babel-core';
import { createFilter } from 'rollup-pluginutils';
import preflightCheck from './preflightCheck.js';
import { warnOnce } from './utils.js';
import { RUNTIME, BUNDLED, HELPERS } from './constants.js';

const keywordHelpers = [ 'typeof', 'extends', 'instanceof' ];

export default function babel ( options ) {
	options = Object.assign( {}, options || {} );
	let inlineHelpers = {};

	const filter = createFilter( options.include, options.exclude );
	delete options.include;
	delete options.exclude;

	if ( options.sourceMap !== false ) options.sourceMaps = true;
	if ( options.sourceMaps !== false ) options.sourceMaps = true;
	delete options.sourceMap;

	const runtimeHelpers = options.runtimeHelpers;
	delete options.runtimeHelpers;

	let externalHelpers;
	if ( options.externalHelpers ) externalHelpers = true;
	delete options.externalHelpers;

	let externalHelpersWhitelist = null;
	if ( options.externalHelpersWhitelist ) externalHelpersWhitelist = options.externalHelpersWhitelist;
	delete options.externalHelpersWhitelist;

	let warn = msg => console.warn(msg); // eslint-disable-line no-console

	return {
		name: 'babel',

		options ( options ) {
			warn = options.onwarn || warn;
		},

		resolveId ( id ) {
			if ( id === HELPERS ) return id;
		},

		load ( id ) {
			if ( id === HELPERS ) {
				const pattern = new RegExp( `babelHelpers\\.(${keywordHelpers.join('|')})`, 'g' );

				const helpers = buildExternalHelpers( externalHelpersWhitelist, 'var' )
					.replace(/^var babelHelpers = \{\};\n/gm, '')
					.replace(/\nbabelHelpers;$/gm, '')
					.replace( pattern, 'var _$1' )
					.replace( /^babelHelpers\./gm, 'export var ' ) +
					`\n\nexport { ${keywordHelpers.map( word => `_${word} as ${word}`).join( ', ')} }`;

				return helpers;
			}
		},

		transform ( code, id ) {
			if ( !filter( id ) ) return null;
			if ( id === HELPERS ) return null;

			const helpers = preflightCheck( options, dirname( id ) );
			const localOpts = Object.assign({ filename: id }, options );

			const transformed = transform( code, localOpts );
			const { usedHelpers } = transformed.metadata;

			if ( usedHelpers.length ) {
				if ( helpers === BUNDLED ) {
					if ( !externalHelpers ) {
						transformed.code += `\n\nimport * as babelHelpers from '${HELPERS}';`;
					}
				} else if ( helpers === RUNTIME ) {
					if ( !runtimeHelpers ) {
						throw new Error( 'Runtime helpers are not enabled. Either exclude the transform-runtime Babel plugin or pass the `runtimeHelpers: true` option. See https://github.com/rollup/rollup-plugin-babel#configuring-babel for more information' );
					}
				} else {
					usedHelpers.forEach( helper => {
						if ( inlineHelpers[ helper ] ) {
							warnOnce( warn, `The '${helper}' Babel helper is used more than once in your code. It's strongly recommended that you use the "external-helpers" plugin or the "es2015-rollup" preset. See https://github.com/rollup/rollup-plugin-babel#configuring-babel for more information` );
						}

						inlineHelpers[ helper ] = true;
					});
				}
			}

			return {
				code: transformed.code,
				map: transformed.map
			};
		}
	};
}
