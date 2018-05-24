'use strict'

module.exports = spawn

const os = require('os')
const fs = require('fs')
const path = require('path')
const _spawn = require('child_process').spawn
const EventEmitter = require('events').EventEmitter
const _spawnSync = require('child_process').spawnSync

let progressEnabled
let running = 0

function startRunning (log) {
  if (progressEnabled == null) progressEnabled = log.progressEnabled
  if (progressEnabled) log.disableProgress()
  ++running
}

function stopRunning (log) {
  --running
  if (progressEnabled && running === 0) log.enableProgress()
}

function willCmdOutput (stdio) {
  if (stdio === 'inherit') return true
  if (!Array.isArray(stdio)) return false
  for (let fh = 1; fh <= 2; ++fh) {
    if (stdio[fh] === 'inherit') return true
    if (stdio[fh] === 1 || stdio[fh] === 2) return true
  }
  return false
}

function getGitDirByRegstry (arch) {
  const args = [
    'QUERY',
    'HKLM\\SOFTWARE\\GitForWindows',
    '/v',
    'InstallPath'
  ]

  if (arch) {
    args.push('/reg:' + arch)
  }

  const stdout = _spawnSync('reg.exe', args).stdout

  if (stdout && /^\s*InstallPath\s+REG(?:_[A-Z]+)+\s+(.+?)$/im.test(stdout.toString())) {
    return RegExp.$1
  } else if (arch === 64) {
    return getGitDirByRegstry(32)
  }
}

function getGitPath (cmd) {
  let gitInstRoot
  if ('GIT_INSTALL_ROOT' in process.env) {
    gitInstRoot = process.env.GIT_INSTALL_ROOT
  } else {
    const osArch = /64$/.test(process.env.PROCESSOR_ARCHITEW6432 || process.arch) ? 64 : 32
    gitInstRoot = getGitDirByRegstry(osArch)
    process.env.GIT_INSTALL_ROOT = gitInstRoot
    if (gitInstRoot && !process.env.MSYSTEM) {
      let binDir = [
        'mingw64/bin',
        'usr/local/bin',
        'usr/bin',
        'bin',
        'usr/bin/vendor_perl',
        'usr/bin/core_perl'
      ].map(function (dir) {
        return path.join(gitInstRoot, dir)
      })

      if (!fs.existsSync(binDir[0])) {
        binDir[0] = path.join(gitInstRoot, 'mingw32/bin')
      }

      binDir.unshift(path.join(os.homedir(), 'bin'))

      const rawPath = process.env.PATH.split(path.delimiter)

      binDir = binDir.filter(function (dir) {
        return rawPath.indexOf(dir) < 0
      })

      binDir.push(process.env.PATH)

      process.env.PATH = binDir.join(path.delimiter)
    }
  }

  if (gitInstRoot) {
    cmd = path.join(gitInstRoot, cmd)
  }
  return cmd
}

function spawn (cmd, args, options, log) {
  if (process.platform === 'win32' && cmd[0] === '/') {
    cmd = getGitPath(cmd)
  }

  const cmdWillOutput = willCmdOutput(options && options.stdio)

  if (cmdWillOutput) startRunning(log)
  const raw = _spawn(cmd, args, options)
  const cooked = new EventEmitter()

  raw.on('error', function (er) {
    if (cmdWillOutput) stopRunning(log)
    er.file = cmd
    cooked.emit('error', er)
  }).on('close', function (code, signal) {
    if (cmdWillOutput) stopRunning(log)
    // Create ENOENT error because Node.js v8.0 will not emit
    // an `error` event if the command could not be found.
    if (code === 127) {
      const er = new Error('spawn ENOENT')
      er.code = 'ENOENT'
      er.errno = 'ENOENT'
      er.syscall = 'spawn'
      er.file = cmd
      cooked.emit('error', er)
    } else {
      cooked.emit('close', code, signal)
    }
  })

  cooked.stdin = raw.stdin
  cooked.stdout = raw.stdout
  cooked.stderr = raw.stderr
  cooked.kill = function (sig) { return raw.kill(sig) }

  return cooked
}
