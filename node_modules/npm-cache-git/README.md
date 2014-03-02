[![Build Status](https://travis-ci.org/robertkowalski/npm-cache-git.png?branch=master)](https://travis-ci.org/robertkowalski/npm-cache-git)

# npm-cache-git

Most of the git parts of cache.js

## API

### .checkGitDir(opts, log, rm, cloneGitRemote, archiveGitRemote, cb)
Checks the status of the git directory, delegates to `cloneGitRemote`
or `archiveGitRemote`

### .cloneGitRemote(opts, log, archiveGitRem, cb)
Runs a git clone, delegates to `archiveGitRemote`

### .archiveGitRemote(opts, log, cb)
Creates a tarball from the git repo, then calls a callback
