'use strict';
const isOptionObject = require('is-plain-obj');

const hasOwnProperty = Object.prototype.hasOwnProperty;
const propIsEnumerable = Object.propertyIsEnumerable;
const globalThis = this;
const defaultMergeOpts = {
	concatArrays: false
};

const getEnumerableOwnPropertyKeys = value => {
	const keys = [];

	for (const key in value) {
		if (hasOwnProperty.call(value, key)) {
			keys.push(key);
		}
	}

	/* istanbul ignore else  */
	if (Object.getOwnPropertySymbols) {
		const symbols = Object.getOwnPropertySymbols(value);

		for (let i = 0; i < symbols.length; i++) {
			if (propIsEnumerable.call(value, symbols[i])) {
				keys.push(symbols[i]);
			}
		}
	}

	return keys;
};

function clone(value) {
	if (Array.isArray(value)) {
		return cloneArray(value);
	}

	if (isOptionObject(value)) {
		return cloneOptionObject(value);
	}

	return value;
}

function cloneArray(array) {
	const result = array.slice(0, 0);

	getEnumerableOwnPropertyKeys(array).forEach(key => {
		result[key] = clone(array[key]);
	});

	return result;
}

function cloneOptionObject(obj) {
	const result = Object.getPrototypeOf(obj) === null ? Object.create(null) : {};

	getEnumerableOwnPropertyKeys(obj).forEach(key => {
		result[key] = clone(obj[key]);
	});

	return result;
}

/**
 * @param merged {already cloned}
 * @return {cloned Object}
 */
const mergeKeys = (merged, source, keys, mergeOpts) => {
	keys.forEach(key => {
		if (key in merged) {
			merged[key] = merge(merged[key], source[key], mergeOpts);
		} else {
			merged[key] = clone(source[key]);
		}
	});

	return merged;
};

/**
 * @param merged {already cloned}
 * @return {cloned Object}
 *
 * see [Array.prototype.concat ( ...arguments )](http://www.ecma-international.org/ecma-262/6.0/#sec-array.prototype.concat)
 */
const concatArrays = (merged, source, mergeOpts) => {
	let result = merged.slice(0, 0);
	let resultIndex = 0;

	[merged, source].forEach(array => {
		const indices = [];

		// `result.concat(array)` with cloning
		for (let k = 0; k < array.length; k++) {
			if (!hasOwnProperty.call(array, k)) {
				continue;
			}

			indices.push(String(k));

			if (array === merged) {
				// Already cloned
				result[resultIndex++] = array[k];
			} else {
				result[resultIndex++] = clone(array[k]);
			}
		}

		// Merge non-index keys
		result = mergeKeys(result, array, getEnumerableOwnPropertyKeys(array).filter(key => {
			return indices.indexOf(key) === -1;
		}), mergeOpts);
	});

	return result;
};

/**
 * @param merged {already cloned}
 * @return {cloned Object}
 */
function merge(merged, source, mergeOpts) {
	if (mergeOpts.concatArrays && Array.isArray(merged) && Array.isArray(source)) {
		return concatArrays(merged, source, mergeOpts);
	}

	if (!isOptionObject(source) || !isOptionObject(merged)) {
		return clone(source);
	}

	return mergeKeys(merged, source, getEnumerableOwnPropertyKeys(source), mergeOpts);
}

module.exports = function () {
	const mergeOpts = merge(clone(defaultMergeOpts), (this !== globalThis && this) || {}, defaultMergeOpts);
	let merged = {};

	for (let i = 0; i < arguments.length; i++) {
		const option = arguments[i];

		if (option === undefined) {
			continue;
		}

		if (!isOptionObject(option)) {
			throw new TypeError('`' + option + '` is not an Option Object');
		}

		merged = merge(merged, option, mergeOpts);
	}

	return merged;
};
