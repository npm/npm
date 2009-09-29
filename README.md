# npm – The Node Package Manager

npm is a little package manager for the Node javascript library.

## 5-Second(ish) Install

You should already have node installed and working.  If you don't, go do that first.

Then, come back here, and run:

    ./install.js

and it'll install itself and its requirements.

## Commands

You can get more details on any of these by doing `npm <command> --help`.  Here are the basics.

All flags with two hyphens can be abbreviated to a single hyphen with the first letter, so you can also do `npm <command> -h` to get its info.

All commands return 0 if they succeed, and usually 1 if they don't.  Normal output is on stdout, and oddness goes to stderr.  Use the `--verbose` flag with any command to send extra debugging output to stderr.

### Managing Sources

npm learns all it knows about packages by looking at the JSON files specified in its catalog list.  Manage this catalog list via the `npm source` commands.

### Update Package Metadata

Fetch the latest info from every source by doing `npm refresh`.  Throw a `--force` on there if you want to clear the cache first.

It's a good idea to update every so often, maybe even put it on a weekly cron or something.

    @TODO: Keep track of which packages were updated, and then
    add them to an "outdated" list.  Then, `npm update` could
    be an alias to `npm refresh && npm install --force --outdated`

### Update Package Code

Version numbers aren't yet supported, so npm can't tell when a package has new code for you. If you know that it does, you can do `npm install --force <package>` to force-install the latest version.

### Find a Package

Find a package in the list by doing `npm search <string>`.  If you only want to search through installed packages, then do `npm search --installed <string>`.  If you only want to search through activated packages, then do `npm search --active <string>`.

### Activating/Deactivating Packages

Use `npm activate <package>`.  Note that installing a package activates it by default, and uninstalling it deactivates it first.

### Starting/stopping Packages

Some packages are servers and the like that must be activated after being installed.  To do this, do `npm start <package>`.  To stop it, do `npm stop <package>`.

### Remove a Package

You can uninstall a package by doing `npm remove <package>`.  This will first `stop` it if it's running, then remove its files from your system.

## Setting Defaults and Aliases via `$HOME/.npmrc`

Gee, it'd sure be nice to be able to have a `$HOME/.npmrc` file that could maybe pre-fix some of these options, dotcha think?

Write it, and send me a pull request, kthx.