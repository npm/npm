'use strict';

function getOptions(options) {
    options = {
        // Own options
        validator: undefined,
        retry: true,
        trim: true,
        default: undefined,

        // `read` package options
        silent: false,
        replace: '',
        input: process.stdin,
        output: process.stdout,

        ...options,
    };

    // Validate that default is a string
    if (options.default !== undefined && typeof options.default !== 'string') {
        throw new Error('The default option value must be a string');
    }

    // Normalize validator to an array
    if (!Array.isArray(options.validator)) {
        options.validator = options.validator ? [options.validator] : [];
    }

    return options;
}

module.exports = getOptions;
