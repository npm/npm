## Before submitting a bug or feature request

* Have you searched for [similar issues](https://github.com/npm/npm/search?q=Similar%20issues&type=Issues)?
* Have you updated to the latest stable version of node, npm and the packages you're using?
* Have you checked that it's not a problem with one of the packages you're using, rather than npm itself?
* Have you looked at what's involved in fixing/implementing this yourself? 
 
Capable programmers should always attempt to investigate and fix problems themselves before asking for others to help. Submit a pull request instead of an issue!

## A great bug report contains

* Context – what were you trying to achieve?
* Detailed steps to reproduce the error from scratch. Try isolating the minimal amount of code needed to reproduce the error.
* A link to the full corresponding `npmdebug.log` output (e.g. as a [gist](https://gist.github.com/)).
* Evidence you've looked into solving the problem and ideally, a theory on the cause and a possible solution.

## A great feature request contains

* The current situation.
* How and why the current situation is problematic.
* A detailed proposal or pull request that demonstrates how the problem could be solved.
* A use case – who needs this feature and why?
* Any caveats.

## A great pull request contains

* Minimal changes. Only submit code relevant to the current issue. Other changes should go in new pull requests.
* Minimal commits. Please squash to a single commit before sending your pull request.
* Code conforming to the existing conventions and formats. i.e. Please don't reformat whitespace.
* Passing tests in `test/tap`. Use [existing tests](https://github.com/npm/npm/tree/master/test/tap) as a reference.
* Relevant [documentation](https://github.com/npm/npm/tree/master/doc).

# Troubleshooting Common Problems

### EPERM, EACCES

* Try again with `sudo`. e.g. `sudo npm install express -g`. or
* [Reinstall node so it doesn't require sudo](https://gist.github.com/isaacs/579814).

### ENOSPC

You are trying to install on a drive that either has no space, or has no permission to write.

* Free some disk space or
* Set the tmp folder somewhere with more space: `npm config set tmp /path/to/big/drive/tmp` or
* [Reinstall node](https://gist.github.com/isaacs/579814) somewhere writable with lots of space.

### 404

* It's most likely a temporary npm server glitch. Check [npm server status](https://twitter.com/npmjs) and try again later.
* If the error persists, perhaps the published package is corrupt. Contact the package owner and have them republish the package at the version that's having problems.

### SyntaxError: Unexpected token X at Object.parse

* Possible temporary npm server glitch, or corrupted local server cache. Run `npm cache clear` and/or try again later. 
* Check that it's not a problem with a package you're trying to install (e.g. invalid `package.json`).

### Other

* Some strange issues can be resolved by simply running `npm cache clear` and trying again.
