const fs = require('fs');
const promiseCommand = require('./promiseCommand');
const argv = require('./arguments').get()

const runner = argv.mock ?
    (command) => {
        console.log('>>>mock ', command)
        return Promise.resolve(fs.readFileSync(`mock-${command.substr(0, 4)}.json`))
    }
    :
    (command, opts) => promiseCommand('npm ' + command + ' --json', opts);

module.exports = {
    runNpmCommand(command, opts) {
        return runner(command, opts).then(output => {
            try {
                return JSON.parse(output)
            } catch (e) {
                console.error('failed to parse output')
                console.error(output)
                throw e;
            }
        })
    }
}