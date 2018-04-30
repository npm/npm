'use strict';

const blacklist = [
	'freelist',
	'sys'
];

module.exports = Object.keys(process.binding('natives'))
	.filter(x => !/^_|^internal|\//.test(x) && blacklist.indexOf(x) === -1)
	.sort();
