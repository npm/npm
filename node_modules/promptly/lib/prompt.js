'use strict';

const { EOL } = require('os');
const pify = require('pify');
const read = pify(require('read'));

async function prompt(message, options) {
    // Read input
    let value = await read({
        prompt: message,
        silent: options.silent,
        replace: options.replace,
        input: options.input,
        output: options.output,
    });

    // Trim?
    if (options.trim) {
        value = value.trim();
    }

    // Prompt again if there's no data or use the default value
    if (!value) {
        if (options.default === undefined) {
            return prompt(message, options);
        }

        value = options.default;
    }

    // Validator verification
    try {
        value = options.validator.reduce((value, validator) => validator(value), value);
    } catch (err) {
        // Retry automatically if the retry option is enabled
        if (options.retry) {
            err.message && options.output.write(err.message + EOL);

            return prompt(message, options);
        }

        throw err;
    }

    return value;
}

module.exports = prompt;
