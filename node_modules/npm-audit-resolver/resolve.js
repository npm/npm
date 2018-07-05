#!/usr/bin/env node
const core = require('./index')
const npmFacade = require('./src/npmfacade');

npmFacade.runNpmCommand('audit', { ignoreExit: true })
    .then(input => {
        console.log(`Total of ${input.actions.length} actions to process`)
        return core.resolveAudit(input)
    })
    .then(() => console.log('done.'))
    .catch(e => console.error(e));
