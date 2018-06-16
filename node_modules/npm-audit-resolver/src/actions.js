const promiseCommand = require('./promiseCommand');
const resolutionState = require('./resolutionState');
const investigate = require('./investigate');
const chalk = require('chalk')

function saveResolutionAll(action, resolution) {
    action.resolves.map(re => resolutionState.set(
        { id: re.id, path: re.path },
        resolution
    ))

    return resolutionState.flush()
}
function saveResolution(singleResolve, resolution) {
    resolutionState.set(
        { id: singleResolve.id, path: singleResolve.path },
        resolution
    );
    return resolutionState.flush()
}

const LATER = 24 * 60 * 60 * 1000;

const strategies = {
    i: function ignore({ action, advisories, command }) {
        return saveResolutionAll(action, { ignore: 1 });
    },
    r: function remindLater({ action, advisories, command }) {
        return saveResolutionAll(action, { remind: Date.now() + LATER });
    },
    f: function fix({ action, advisories, command }) {
        console.log('Fixing!');
        return promiseCommand(command).then(() =>
            saveResolutionAll(action, { fix: 1 })
        );
    },
    del: function del({ action, advisories, command }) {
        console.log('Removing');
        return Promise.all(Object.keys(action.resolves.reduce((mem, re) => {
            const topModule = re.path.split('>')[0]
            if (topModule) {
                mem[topModule + (re.dev ? ' -D' : ' -S')] = 1
            }
            return mem
        }, {})).map(commandBit => {
            return promiseCommand(`npm rm ${commandBit}`)
        })).then(() => { })
    },
    d: function details({ action, advisories, command }) {
        console.log('');
        
        Object.keys(action.resolves.reduce((mem, re) => {
            mem[re.id] = 1
            return mem
        }, {})).map(advId => {
            const adv = advisories[advId]
            const versions = adv.findings.map(f=>f.version).join()
            console.log(`${chalk.bold(adv.module_name)} versions installed: ${chalk.bold(versions)}
${adv.overview}
${adv.recommendation}
${adv.references}`)
        })
        return null;
    },
    '?': function investigateIt({ action, advisories, command }) {
        console.log('Investigating!');
        return investigate.findFeasibleResolutions({ action, advisories })
    },
    s: function abort() {
        console.log('Skipped');
    },
    q: function abort() {
        console.log('Aborting. Bye!');
        process.exit(1);
    }
};

const noop = () => console.log('doing nothing');
function strategyOf(choice) {
    return strategies[choice] || noop;
}

module.exports = {
    takeAction(choice, details) {
        return strategyOf(choice)(details);
    }
};
