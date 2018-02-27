'use strict'
const Bluebird = require('bluebird')
const writeFile = Bluebird.promisify(require('fs').writeFile)
const packageId = require('../../utils/package-id.js')
const moduleName = require('../../utils/module-name.js')

function hasScope (name) {
  return String(name)[0] === '@'
}

module.exports = function (staging, pkg, log) {
  log.silly('write-asset-index', packageId(pkg))
  const main = pkg.package.main
  const name = moduleName(pkg)
  const prefix = hasScope(name) ? name.slice(name.indexOf('/') + 1) : name
  return writeFile(pkg.path + '.js',
    `export * from './${prefix}/${main}'\n` +
    `import def from './${prefix}/${main}'\n` +
    `export default def\n`)
}
