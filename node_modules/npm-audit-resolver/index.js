#!/usr/bin/env node
const prompter = require('./src/prompter');
const statusManager = require('./src/statusManager');
const argv = require('./src/arguments')

module.exports = {
    resolveAudit(input, args) {
        argv.set(args)
        return input.actions
            .map(statusManager.addStatus)
            .filter(a => {
                if (a.humanReviewComplete) {
                    console.log(`skipping ${a.module} issue based on audit-resolv.json`)
                }
                return !a.humanReviewComplete
            })
            .reduce(
                (prev, action) =>
                    prev.then(() =>
                        prompter.handleAction(action, input.advisories)
                    ),
                Promise.resolve()
            )
    },
    skipResolvedActions(input, args) {
        argv.set(args)
        input.actions = input.actions
            .map(statusManager.addStatus)
            .filter(a => {
                if (a.humanReviewComplete) {
                    console.error(
                        `skipping ${a.module} issue based on audit-resolv.json`
                    );
                }
                return !a.humanReviewComplete;
            })
        return input
    },
    checkAudit(input, args) {
        argv.set(args)
        return input.actions
            .map(statusManager.addStatus)
            .filter(a => {
                if (a.humanReviewComplete) {
                    console.log(
                        `skipping ${a.module} issue based on audit-resolv.json`
                    );
                }
                return !a.humanReviewComplete;
            })
            .forEach(action => {
                const groupedIssues = action.resolves.reduce((groups, re) => {
                    groups[re.id] = groups[re.id] || [];
                    let type = re.dev ? " devDependencies" : "dependencies";
                    re.optional && (type += " (optional)");
                    re.bundled && (type += " (bundled)");
                    let reportLine = ` - ${type}: ${re.path}`;
                    if (re.humanReviewStatus) {
                        re.humanReviewStatus.fix &&
                            (reportLine +=
                                "\n     ^ this issue was marked as fixed earlier");
                        re.humanReviewStatus.remind &&
                            (reportLine +=
                                "\n     ^ this issue was postponed, the time ran out");
                    }
                    groups[re.id].push({
                        data: re,
                        report: reportLine
                    });

                    return groups;
                }, {});

                return Object.keys(groupedIssues).map(reId => {
                    const adv = input.advisories[reId];
                    return {
                        title: adv.title,
                        severity: adv.severity,
                        items: groupedIssues[reId]
                    }
                });

            });
    }
}
