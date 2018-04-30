import MagicString from 'magic-string';
import fs from 'fs';

export default function shebangPlugin({ shebang, entry }={}) {
	function processEntry(entry) {
		if (entry) {
			let contents = fs.readFileSync(entry, 'utf8');
			let matches = contents.match(/^\s*(#!.*)/);
			shebang = matches && matches[1] || false;
		}
	}
	processEntry(entry);

	return {
		name: 'preserve-shebang',
		options(options) {
			if (!entry) {
				entry = options.input;
				processEntry(entry);
			}
			return options;
		},
		transformBundle(code, { format, sourcemap }) {
			if (!shebang) return;

			let str = new MagicString(code);
			str.prepend(shebang+'\n');
			return {
				code: str.toString(),
				map: sourcemap ? str.generateMap({ hires: true }) : undefined
			};
		}
	};
}