'use strict'
// remove a package.

module.exports = asset

const path = require('path')
const npm = require('./npm.js')
const install = require('./install.js')
const Installer = install.Installer
const Uninstaller = require('./uninstall.js').Uninstaller
const Bluebird = require('bluebird')
const readShrinkwrap = Bluebird.promisify(require('./install/read-shrinkwrap.js'))
const inflateShrinkwrap = Bluebird.promisify(require('./install/inflate-shrinkwrap.js'))
const readPackageJson = Bluebird.promisify(require('read-package-json'))
const lsFromTree = Bluebird.promisify(require('./ls.js').fromTree)
const usage = require('./utils/usage')
const computeMetadata = require('./install/deps.js').computeMetadata
const readAssetList = require('./utils/read-asset-list.js')

asset.usage = usage(
  'asset',
  'npm asset [install|remove|ls]...'
) + '\n\n' +
  'To add or remove assets from your project:\n' +
  '    npm asset install <pkg>[@<version>]...\n' +
  '    npm asset uninstall <pkg>...\n' +
  'To list assets in your project:\n' +
  '    npm asset ls\n' +
  'To install your assets and your dependencies:\n' +
  '    npm install\n' +
  'To only install your assets:\n' +
  '    npm install --only=assets\n' +
  'To only install your dependencies:\n' +
  '    npm install --no-assets'

asset.completion = install.completion

function showAssetHelp () {
  console.error(asset.usage)
  process.exitCode = 1
}
function showAssetInstallHelp () {
  console.error('npm asset install [<@scope>/]<pkg>[@<version>]')
  console.error('')
  console.error('aliases: isntall, add, i')

  process.exitCode = 1
}
function showAssetUninstallHelp () {
  console.error('npm asset uninstall [<@scope>/]<pkg>')
  console.error('')
  console.error('aliases: un, remove, rm')
  process.exitCode = 1
}

function asset (args, cb) {
  if (args.length === 0) return cb(showAssetHelp())
  const cmd = args.shift()
  switch (cmd) {
    case 'install':
    case 'isntall':
    case 'add':
    case 'i':
      return assetInstall(args, cb)
    case 'uninstall':
    case 'un':
    case 'remove':
    case 'rm':
      return assetUninstall(args, cb)
    case 'ls':
    case 'list':
      return assetList(args, cb)
  }
}

function assetInstall (args, cb) {
  if (args.length === 0) return cb(showAssetInstallHelp())
  new AssetInstaller(args).run(cb)
}

class AssetInstaller extends Installer {
  constructor (args, opts) {
    if (!opts) opts = {}
    opts['save-assets'] = true
    super(args, opts)
  }
  reportArgsInstalled () {
    if (!this.args.length) return ''
    return this.args.map((p) => {
      return `+ asset:${p.name}@${p.version}`
    }).join('\n') + '\n'
  }
}

function assetUninstall (args, cb) {
  if (args.length === 0) return cb(showAssetUninstallHelp())
  new AssetUninstaller(args).run(cb)
}

class AssetUninstaller extends Uninstaller {
  constructor (args, opts) {
    if (!opts) opts = {}
    opts['save-assets'] = true
    super(args, opts)
  }
  reportArgsInstalled () {
    if (!this.args.length) return ''
    return this.args.map((p) => {
      return `- asset:${p.name}`
    }).join('\n') + '\n'
  }
}

function assetList (args, cb) {
  const dir = path.resolve(npm.dir, '..')
  return Bluebird.join(
    readAssetList(path.resolve(dir, 'assets')),
    readPackageJson(path.resolve(dir, 'package.json')).catch(() => {}),
    (assets, pkg) => ({
      package: pkg,
      path: dir,
      realpath: dir,
      isTop: true,
      children: assets
    })
  ).catch(() => ({isTop: true, package: {}, path: dir})).then((tree) => {
    tree.children.forEach((asset) => { asset.parent = tree })
    return readShrinkwrap(tree).then(() => {
      if (!tree.package._shrinkwrap) return
      // we're only listing assets, so ignore the dependencies section
      tree.package.dependencies = {}
      tree.package.devDependencies = {}
      tree.package.optionalDependencies = {}
      return inflateShrinkwrap(tree, tree.package._shrinkwrap)
    }).then(() => {
      return lsFromTree(dir, computeMetadata(tree), args, {skipDeps: true})
    })
  }).asCallback(cb)
}
