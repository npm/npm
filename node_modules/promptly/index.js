'use strict';

const prompt = require('./lib/prompt');
const getOptions = require('./lib/getOptions');

const promptly = module.exports;

promptly.prompt = (message, options) => {
    options = getOptions(options);

    return prompt(message, options);
};

promptly.password = (message, options) => {
    options = getOptions({
        silent: true, // Hide password chars
        trim: false, // Do not trim so that spaces can be part of the password
        default: '', // Allow empty passwords
        ...options,
    });

    return prompt(message, options);
};

promptly.confirm = (message, options) => {
    options = getOptions({
        trim: false, // Do not trim so that only exact matches pass the validator
        ...options,
    });

    // Unshift the validator that will coerse boolean values
    options.validator.unshift((value) => {
        value = value.toLowerCase();

        switch (value) {
        case 'y':
        case 'yes':
        case '1':
            return true;
        case 'n':
        case 'no':
        case '0':
            return false;
        default:
            throw new Error(`Invalid choice: ${value}`);
        }
    });

    return prompt(message, options);
};

promptly.choose = (message, choices, options) => {
    options = getOptions({
        trim: false, // Do not trim so that only exact matches pass the validator
        ...options,
    });

    // Unshift the validator that will validate the data against the choices
    options.validator.unshift((value) => {
        // Check if the value exists by comparing values loosely
        // Additionally, use the coorced value
        const index = choices.findIndex((choice) => value == choice); // eslint-disable-line eqeqeq

        if (index === -1) {
            throw new Error(`Invalid choice: ${value}`);
        }

        return choices[index];
    });

    return prompt(message, options);
};
