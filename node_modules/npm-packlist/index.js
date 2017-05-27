'use strict'
const ignoreWalk = require('ignore-walk')
const IgnoreWalker = ignoreWalk.Walker
const IgnoreWalkerSync = ignoreWalk.WalkerSync

const rootBuiltinRules = Symbol('root-builtin-rules')
const packageNecessaryRules = Symbol('package-necessary-rules')
const path = require('path')

// a decorator that applies our custom rules to an ignore walker
const npmWalker = Class => class Walker extends Class {
  constructor (opt) {
    opt = opt || {}

    // the order in which rules are applied.
    opt.ignoreFiles = [
      rootBuiltinRules,
      'package.json',
      '.npmignore',
      '.gitignore',
      packageNecessaryRules
    ]

    opt.includeEmpty = true
    opt.path = opt.path || process.cwd()
    opt.follow = path.basename(opt.path) === 'node_modules'
    super(opt)

    // ignore a bunch of things by default at the root level.
    // also ignore anything in node_modules, except bundled dependencies
    if (!this.parent) {
      this.bundled = opt.bundled || []
      const rules = [
        '**/.npmignore',
        '**/.gitignore',
        '/node_modules/',
        '/node_modules/.bin',
        '**/.git/',
        '**/.svn/',
        '**/.hg/',
        '**/CVS/',
        '/.lock-wscript',
        '/.wafpickle-*',
        '/build/config.gypi',
        'npm-debug.log',
        '**/.npmrc',
        '.*.swp',
        '.DS_Store',
        '._*',
        '.*.orig',
        '/test{,s}/'
      ].concat(this.bundled.map(dep => '!/node_modules/' + dep))
      .join('\n') + '\n'
      super.onReadIgnoreFile(rootBuiltinRules, rules, _=>_)
    }
  }

  filterEntries () {
    if (this.ignoreRules['package.json'])
      this.ignoreRules['.gitignore'] = this.ignoreRules['.npmignore'] = null
    else if (this.ignoreRules['.npmignore'])
      this.ignoreRules['.gitignore'] = null
    this.filterEntries = super.filterEntries
    super.filterEntries()
  }

  onReadIgnoreFile (file, data, then) {
    if (file === 'package.json') {
      try {
        const pkg = JSON.parse(data)

        // if there's a browser or main, make sure we don't ignore it
        const rules = [
          pkg.browser ? '!' + pkg.browser : '',
          pkg.main ? '!' + pkg.main : '',
          '!package.json',
          '!@(readme|license|licence|notice|changes|changelog|history){,.*}'
        ].filter(f => f).join('\n') + '\n'
        super.onReadIgnoreFile(packageNecessaryRules, rules, _=>_)

        if (!Array.isArray(pkg.files) || !pkg.files.length)
          return then()
        else
          data = '*\n' + pkg.files.map(
            f => '!' + f + '\n!' + f.replace(/\/+$/, '') + '/**'
          ).join('\n') + '\n'
      } catch (er) {
        // ignore package.json files that are not json
        return then()
      }
    }
    return super.onReadIgnoreFile(file, data, then)
  }

  sort (a, b) {
    return sort(a, b)
  }
}

class Walker extends npmWalker(IgnoreWalker) {
  walker (entry, then) {
    new Walker(this.walkerOpt(entry)).on('done', then).start()
  }
}

class WalkerSync extends npmWalker(IgnoreWalkerSync) {
  walker (entry) {
    new WalkerSync(this.walkerOpt(entry)).start()
  }
}

const walk = (options, callback) => {
  const p = new Promise((resolve, reject) => {
    new Walker(options).on('done', resolve).on('error', reject).start()
  })
  return callback ? p.then(res => callback(null, res), callback) : p
}

const walkSync = options => {
  return new WalkerSync(options).start().result
}

// package.json first, node_modules last, files before folders, alphasort
const sort = (a, b) =>
  a === 'package.json' ? -1
  : b === 'package.json' ? 1
  : /^node_modules/.test(a) ? 1
  : /^node_modules/.test(b) ? -1
  : path.dirname(a) === '.' && path.dirname(b) !== '.' ? -1
  : path.dirname(b) === '.' && path.dirname(a) !== '.' ? 1
  : a.localeCompare(b)

module.exports = walk
walk.sync = walkSync
walk.Walker = Walker
walk.WalkerSync = WalkerSync
