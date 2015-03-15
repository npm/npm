npm-report(1) -- Report new issue in the browser
===================================

## SYNOPSIS

    npm report [--title]

## DESCRIPTION

This command helps creating new issue to npm/support-cli for a user got error.  Open new issue page using the `--browser` config param and if there's a `npm-debug.log` or a title option, it's pasted to the information of new issue.

## CONFIGURATION

### browser

* Default: OS X: `"open"`, Windows: `"start"`, Others: `"xdg-open"`
* Type: String

### title

* Default: none
* Type: String

## SEE ALSO

* npm-bug(1)
* npm-config(1)
* npm-faq(7)
