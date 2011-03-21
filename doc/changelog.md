npm-changelog(1) -- Changes
===========================

## HISTORY

* 0.0  
  Lots of sketches and false starts.  Abandoned a few times.  
  Core functionality established.  
  alpha.

* 0.1  
  push to beta, and announce  
  documentation, caching, more robust script support  
  ownership tracking in the registry (no more admin party!)  
  more robust config and option parsing  
  stabilize semver semantics  
  tests  
  update command  
  bundle command  
  Rollback for failed installations  
  Solaris and Cygwin support

* 0.2  
  First allegedly "stable" release.
  Various fixes found during the Node Knockout extravaganza  
  Minor updates and bugfixes  
  more complete semver functionality  
  Make npm OK to use programmatically (Charlie Robbins)
  recursive package removal  
  tab completion (Evan Meagher)  
  shasums on all tarballs  
  explore command: see `npm help explore`  
  docs command: see `npm help docs`  
  Frequently asked questions at `npm faq`
  xmas easter egg  
  work with homebrew nodejs  
  Support for `"<name>":"<url>"` for dependencies.

* 0.3  
  More correct permission/uid handling.  (Sudo now encouraged!)  
  Require node 0.4.0  
  Separate semver out into a separate utility.  
  Packages without "main" modules don't export modules.  
  Remove support for invalid JSON (since node doesn't support it)  
  No shims! (Still has symlinks, though)

* 1.0  
  Simplify configuration greatly.  
  Install locally (bundle by default)  
  Drastic rearchitecture
