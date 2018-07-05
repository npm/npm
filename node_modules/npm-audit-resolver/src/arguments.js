var argv = require('yargs-parser')(process.argv.slice(2));

module.exports = {
    get: () => argv,
    set: a => {
        if (a) { argv = a }
    }
}