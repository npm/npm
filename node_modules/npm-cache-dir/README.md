[![Build Status](https://travis-ci.org/robertkowalski/npm-cache-dir.png?branch=master)](https://travis-ci.org/robertkowalski/npm-cache-dir)

# npm-cache-dir

Get stats about npm's cache dir and create the directory
lazily

## API

### .getCacheStat(npmCache, log, cb)
Get fs.stats about npm's cache dir, and create the cachedir
if it does not exist

### .makeCacheDir(npmCache, log, cb)
Create the cache dir according to the setting in `npm.cache`
