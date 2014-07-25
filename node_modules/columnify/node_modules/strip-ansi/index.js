'use strict';
module.exports = function (str) {
	return typeof str === 'string' ? str.replace(/\x1B\[([0-9]{1,3}(;[0-9]{1,3})*)?[m|K]/g, '') : str;
};
