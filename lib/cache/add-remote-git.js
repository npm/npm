var assert = require('assert')
var fs = require('graceful-fs')
var path = require('path')

var chownr = require('chownr')
var dezalgo = require('dezalgo')
var inflight = require('inflight')
var log = require('npmlog')
var mkdir = require('mkdirp')
var npa = require('npm-package-arg')
var uniqueFilename = require('unique-filename')

var addLocal = require('./add-local.js')
var correctMkdir = require('../utils/correct-mkdir.js')
var git = require('../utils/git.js')
var npm = require('../npm.js')
var rm = require('../utils/gently-rm.js')
var tempFilename = require('../utils/temp-filename.js')

var remotes = path.resolve(npm.config.get('cache'), '_git-remotes')
var templates = path.join(remotes, '_templates')

var VALID_VARIABLES = [
  'GIT_ASKPASS',
  'GIT_EXEC_PATH',
  'GIT_PROXY_COMMAND',
  'GIT_SSH',
  'GIT_SSH_COMMAND',
  'GIT_SSL_CAINFO',
  'GIT_SSL_NO_VERIFY'
]

module.exports = addRemoteGit
function addRemoteGit (spec, _cb) {
  assert(typeof spec === 'string', 'must have git specifier')
  assert(typeof _cb === 'function', 'must have callback')
  var cb = dezalgo(_cb)

  log.verbose('addRemoteGit', 'caching', spec)

  // the URL comes in exactly as it was passed on the command line, or as
  // normalized by normalize-package-data / read-package-json / read-installed,
  // so figure out what to do with it using hosted-git-info
  var toGet = npa.resolve(null, spec)
  if (toGet.gitRange != null) {
    var err = new Error('This version of npm does not support using semver ranges with git')
    err.code = 'ENOGITSEMVER'
    return cb(err)
  }
  if (toGet.hosted) {
    log.verbose('addRemoteGit', spec, 'is a repository hosted by', toGet.hosted.type)

    // prefer explicit URLs to pushing everything through shortcuts
    if (toGet.hosted.getDefaultRepresentation() !== 'shortcut') {
      return tryClone(toGet, toGet.hosted.toString(), false, cb)
    } else {
      // try git:, then git+ssh:, then git+https: before failing
      return tryGitProto(toGet, cb)
    }
  } else {
    // verify that this is a Git URL before continuing
    if (toGet.type !== 'git') {
      return cb(new Error(spec + ' is not a Git or GitHub specifier'))
    } else {
      return tryClone(toGet, toGet.fetchSpec, false, cb)
    }
  }
}

function tryGitProto (toGet, cb) {
  var gitURL = toGet.hosted.git()
  if (!gitURL) return tryHTTPS(toGet, cb)

  log.silly('tryGitProto', 'attempting to clone', gitURL)
  tryClone(toGet, gitURL, true, function (er) {
    if (er) return tryHTTPS(toGet, cb)

    cb.apply(this, arguments)
  })
}

function tryHTTPS (toGet, cb) {
  var httpsURL = toGet.hosted.https()
  if (!httpsURL) return trySSH(toGet, cb)

  log.silly('tryHTTPS', 'attempting to clone', httpsURL)
  tryClone(toGet, httpsURL, false, function (er) {
    if (er) return trySSH(toGet, cb)
    cb.apply(this, arguments)
  })
}

function trySSH (toGet, cb) {
  var sshURL = toGet.hosted.sshurl()
  if (!sshURL) {
    return cb(new Error(toGet + ' can not be cloned via Git, SSH, or HTTPS'))
  }

  log.silly('trySSH', 'attempting to clone', sshURL)
  tryClone(toGet, sshURL, true, cb)
}

function tryClone (toGet, cloneURL, silent, cb) {
  log.silly('tryClone', 'cloning', toGet.saveSpec, 'via', cloneURL)

  var treeish = toGet.gitCommittish

  // ensure that similarly-named remotes don't collide
  var cachedRemote = uniqueFilename(remotes, cloneURL.replace(/[^a-zA-Z0-9]+/g, '-'), cloneURL)
  var repoID = path.relative(remotes, cachedRemote)
  cachedRemote = path.join(remotes, repoID)

  cb = inflight(repoID, cb)
  if (!cb) {
    return log.verbose('tryClone', repoID, 'already in flight; waiting')
  }
  log.verbose('tryClone', repoID, 'not in flight; caching')

  // initialize the remotes cache with the correct perms
  getGitDir(function (er) {
    if (er) return cb(er)
    fs.stat(cachedRemote, function (er, s) {
      if (er) return mirrorRemote(toGet, cloneURL, treeish, cachedRemote, silent, finish)
      if (!s.isDirectory()) return resetRemote(toGet, cloneURL, treeish, cachedRemote, finish)

      validateExistingRemote(toGet, cloneURL, treeish, cachedRemote, finish)
    })

    // always set permissions on the cached remote
    function finish (er, data) {
      if (er) return cb(er, data)
      addModeRecursive(cachedRemote, npm.modes.file, function (er) {
        return cb(er, data)
      })
    }
  })
}

// don't try too hard to hold on to a remote
function resetRemote (from, cloneURL, treeish, cachedRemote, cb) {
  log.info('resetRemote', 'resetting', cachedRemote, 'for', from)
  rm(cachedRemote, function (er) {
    if (er) return cb(er)
    mirrorRemote(from, cloneURL, treeish, cachedRemote, false, cb)
  })
}

// reuse a cached remote when possible, but nuke it if it's in an
// inconsistent state
function validateExistingRemote (from, cloneURL, treeish, cachedRemote, cb) {
  git.whichAndExec(
    ['config', '--get', 'remote.origin.url'],
    { cwd: cachedRemote, env: gitEnv() },
    function (er, stdout, stderr) {
      var originURL
      if (stdout) {
        originURL = stdout.trim()
        log.silly('validateExistingRemote', from, 'remote.origin.url:', originURL)
      }

      if (stderr) stderr = stderr.trim()
      if (stderr || er) {
        log.warn('addRemoteGit', from, 'resetting remote', cachedRemote, 'because of error:', stderr || er)
        return resetRemote(from, cloneURL, treeish, cachedRemote, cb)
      } else if (cloneURL !== originURL) {
        log.warn(
          'addRemoteGit',
          from,
          'pre-existing cached repo', cachedRemote, 'points to', originURL, 'and not', cloneURL
        )
        return resetRemote(from, cloneURL, treeish, cachedRemote, cb)
      }

      log.verbose('validateExistingRemote', from, 'is updating existing cached remote', cachedRemote)
      updateRemote(from, cloneURL, treeish, cachedRemote, cb)
    }
  )
}

// make a complete bare mirror of the remote repo
// NOTE: npm uses a blank template directory to prevent weird inconsistencies
// https://github.com/npm/npm/issues/5867
function mirrorRemote (from, cloneURL, treeish, cachedRemote, silent, cb) {
  mkdir(cachedRemote, function (er) {
    if (er) return cb(er)

    var args = [
      'clone',
      '--template=' + templates,
      '--mirror',
      cloneURL, cachedRemote
    ]
    git.whichAndExec(
      ['clone', '--template=' + templates, '--mirror', cloneURL, cachedRemote],
      { cwd: cachedRemote, env: gitEnv() },
      function (er, stdout, stderr) {
        if (er) {
          var combined = (stdout + '\n' + stderr).trim()
          var command = 'git ' + args.join(' ') + ':'
          if (silent) {
            log.verbose(command, combined)
          } else {
            log.error(command, combined)
          }
          return cb(er)
        }
        log.verbose('mirrorRemote', from, 'git clone ' + cloneURL, stdout.trim())
        setPermissions(from, cloneURL, treeish, cachedRemote, cb)
      }
    )
  })
}

function setPermissions (from, cloneURL, treeish, cachedRemote, cb) {
  if (process.platform === 'win32') {
    log.verbose('setPermissions', from, 'skipping chownr on Windows')
    resolveHead(from, cloneURL, treeish, cachedRemote, cb)
  } else {
    getGitDir(function (er, cs) {
      if (er) {
        log.error('setPermissions', from, 'could not get cache stat')
        return cb(er)
      }

      chownr(cachedRemote, cs.uid, cs.gid, function (er) {
        if (er) {
          log.error(
            'setPermissions',
            'Failed to change git repository ownership under npm cache for',
            cachedRemote
          )
          return cb(er)
        }

        log.verbose('setPermissions', from, 'set permissions on', cachedRemote)
        resolveHead(from, cloneURL, treeish, cachedRemote, cb)
      })
    })
  }
}

// always fetch the origin, even right after mirroring, because this way
// permissions will get set correctly
function updateRemote (from, cloneURL, treeish, cachedRemote, cb) {
  git.whichAndExec(
    ['fetch', '-a', 'origin'],
    { cwd: cachedRemote, env: gitEnv() },
    function (er, stdout, stderr) {
      if (er) {
        var combined = (stdout + '\n' + stderr).trim()
        log.error('git fetch -a origin (' + cloneURL + ')', combined)
        return cb(er)
      }
      log.verbose('updateRemote', 'git fetch -a origin (' + cloneURL + ')', stdout.trim())

      setPermissions(from, cloneURL, treeish, cachedRemote, cb)
    }
  )
}

// branches and tags are both symbolic labels that can be attached to different
// commits, so resolve the commit-ish to the current actual treeish the label
// corresponds to
//
// important for shrinkwrap
function resolveHead (from, cloneURL, treeish, cachedRemote, cb) {
  log.verbose('resolveHead', from, 'original treeish:', treeish)
  var args = ['rev-list', '-n1', treeish]
  git.whichAndExec(
    args,
    { cwd: cachedRemote, env: gitEnv() },
    function (er, stdout, stderr) {
      if (er) {
        log.error('git ' + args.join(' ') + ':', stderr)
        return cb(er)
      }

      var resolvedTreeish = stdout.trim()
      log.silly('resolveHead', from, 'resolved treeish:', resolvedTreeish)

      var resolvedURL = getResolved(from, cloneURL, resolvedTreeish)
      if (!resolvedURL) {
        return cb(new Error(
          'unable to clone ' + from + ' because git clone string ' +
            cloneURL + ' is in a form npm can\'t handle'
        ))
      }
      log.verbose('resolveHead', from, 'resolved Git URL:', resolvedURL)

      // generate a unique filename
      var tmpdir = path.join(tempFilename('git-cache'), resolvedTreeish)
      log.silly('resolveHead', 'Git working directory:', tmpdir)

      mkdir(tmpdir, function (er) {
        if (er) return cb(er)

        cloneResolved(from, resolvedURL, resolvedTreeish, cachedRemote, tmpdir, cb)
      })
    }
  )
}

// make a clone from the mirrored cache so we have a temporary directory in
// which we can check out the resolved treeish
function cloneResolved (from, resolvedURL, resolvedTreeish, cachedRemote, tmpdir, cb) {
  var args = ['clone', cachedRemote, tmpdir]
  git.whichAndExec(
    args,
    { cwd: cachedRemote, env: gitEnv() },
    function (er, stdout, stderr) {
      stdout = (stdout + '\n' + stderr).trim()
      if (er) {
        log.error('git ' + args.join(' ') + ':', stderr)
        return cb(er)
      }
      log.verbose('cloneResolved', from, 'clone', stdout)

      checkoutTreeish(from, resolvedURL, resolvedTreeish, tmpdir, cb)
    }
  )
}

// there is no safe way to do a one-step clone to a treeish that isn't
// guaranteed to be a branch, so explicitly check out the treeish once it's
// cloned
function checkoutTreeish (from, resolvedURL, resolvedTreeish, tmpdir, cb) {
  var args = ['checkout', resolvedTreeish]
  git.whichAndExec(
    args,
    { cwd: tmpdir, env: gitEnv() },
    function (er, stdout, stderr) {
      stdout = (stdout + '\n' + stderr).trim()
      if (er) {
        log.error('git ' + args.join(' ') + ':', stderr)
        return cb(er)
      }
      log.verbose('checkoutTreeish', from, 'checkout', stdout)

      updateSubmodules(from, resolvedURL, tmpdir, cb)
    }
  )
}

function updateSubmodules (from, resolvedURL, tmpdir, cb) {
  var args = ['submodule', '-q', 'update', '--init', '--recursive']
  git.whichAndExec(
    args,
    { cwd: tmpdir, env: gitEnv() },
    function (er, stdout, stderr) {
      stdout = (stdout + '\n' + stderr).trim()
      if (er) {
        log.error('git ' + args.join(' ') + ':', stderr)
        return cb(er)
      }
      log.verbose('updateSubmodules', from, 'submodule update', stdout)

      // convince addLocal that the checkout is a local dependency
      try {
        var spec = npa(tmpdir)
      } catch (err) {
        log.error('addRemoteGit', 'Failed to map', tmpdir, 'to a package specifier')
        return cb(err)
      }
      // ensure pack logic is applied
      // https://github.com/npm/npm/issues/6400
      addLocal(spec, null, function (er, data) {
        if (data) {
          if (npm.config.get('save-exact')) {
            log.verbose('addRemoteGit', 'data._from:', resolvedURL, '(save-exact)')
            data._from = resolvedURL
          } else {
            log.verbose('addRemoteGit', 'data._from:', from)
            data._from = (from.name ? from.name + '@' : '') + from.saveSpec
          }

          log.verbose('addRemoteGit', 'data._resolved:', resolvedURL)
          data._resolved = resolvedURL
        }

        cb(er, data)
      })
    }
  )
}

function getGitDir (cb) {
  correctMkdir(remotes, function (er, stats) {
    if (er) return cb(er)

    // We don't need global templates when cloning. Use an empty directory for
    // the templates, creating it (and setting its permissions) if necessary.
    mkdir(templates, function (er) {
      if (er) return cb(er)

      // Ensure that both the template and remotes directories have the correct
      // permissions.
      fs.chown(templates, stats.uid, stats.gid, function (er) {
        cb(er, stats)
      })
    })
  })
}

var gitEnv_
function gitEnv () {
  // git responds to env vars in some weird ways in post-receive hooks
  // so don't carry those along.
  if (gitEnv_) return gitEnv_

  // allow users to override npm's insistence on not prompting for
  // passphrases, but default to just failing when credentials
  // aren't available
  gitEnv_ = { GIT_ASKPASS: 'echo' }

  for (var k in process.env) {
    if (!~VALID_VARIABLES.indexOf(k) && k.match(/^GIT/)) continue
    gitEnv_[k] = process.env[k]
  }
  return gitEnv_
}

addRemoteGit.getResolved = getResolved
function getResolved (from, uri, treeish) {
  if (from.hosted) {
    return npa.resolve(null, uri.replace(/#.*$/, '') + '#' + treeish).saveSpec
  } else {
    return from.saveSpec.replace(/#.*$/, '') + '#' + treeish
  }
}

// similar to chmodr except it add permissions rather than overwriting them
// adapted from https://github.com/isaacs/chmodr/blob/master/chmodr.js
function addModeRecursive (cachedRemote, mode, cb) {
  fs.readdir(cachedRemote, function (er, children) {
    // Any error other than ENOTDIR means it's not readable, or doesn't exist.
    // Give up.
    if (er && er.code !== 'ENOTDIR') return cb(er)
    if (er || !children.length) return addMode(cachedRemote, mode, cb)

    var len = children.length
    var errState = null
    children.forEach(function (child) {
      addModeRecursive(path.resolve(cachedRemote, child), mode, then)
    })

    function then (er) {
      if (errState) return undefined
      if (er) return cb(errState = er)
      if (--len === 0) return addMode(cachedRemote, dirMode(mode), cb)
    }
  })
}

function addMode (cachedRemote, mode, cb) {
  fs.stat(cachedRemote, function (er, stats) {
    if (er) return cb(er)
    mode = stats.mode | mode
    fs.chmod(cachedRemote, mode, cb)
  })
}

// taken from https://github.com/isaacs/chmodr/blob/master/chmodr.js
function dirMode (mode) {
  if (mode & parseInt('0400', 8)) mode |= parseInt('0100', 8)
  if (mode & parseInt('040', 8)) mode |= parseInt('010', 8)
  if (mode & parseInt('04', 8)) mode |= parseInt('01', 8)
  return mode
}
