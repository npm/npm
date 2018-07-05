#!/usr/bin/env node
const core = require("./index");
const npmFacade = require('./src/npmfacade');

npmFacade.runNpmCommand('audit', { ignoreExit: true })
    .then(input => {
        console.log(`Total of ${input.actions.length} actions to process`);
        return core.checkAudit(input)
    })
    .then(issues => {
        if(issues && issues.length){
            issues.forEach(issue => {
                console.log(
                    `--------------------------------------------------`
                );
                console.log(`[${issue.severity}] ${issue.title}`);
                console.log(issue.items.map(item => item.report).join("\n"));
            })

            console.log(
                `--------------------------------------------------`
            );
            console.error(" 😱   Unresolved issues found!");
            console.log(
                `--------------------------------------------------`
            );
            process.exit(1);
        }
    })
    .then(() => console.log("audit ok."))
    .catch(e => {
        console.error(e);
        process.exit(2);
    });
