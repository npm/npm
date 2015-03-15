npm-report(3) -- Report new issue in the browser
========================================================

## SYNOPSIS

    npm.commands.report(args, callback)

## DESCRIPTION

This command helps creating new issue to npm/support-cli. Open new issue page using the `--browser` config param and if there's a `npm-debug.log` or a title argument, it's pasted to the information of new issue.

This command will launch a browser, so this command may not be the most
friendly for programmatic use.
