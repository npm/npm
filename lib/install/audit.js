'use strict'
exports.saveAudit = saveAudit

const Bluebird = require('bluebird')
const writeFile = Bluebird.promisify(require('fs').writeFile)
const treeToShrinkwrap = require('../shrinkwrap.js').treeToShrinkwrap
const packageId = require('../utils/package-id.js')

function saveAudit (tree, diffs, install, remove) {
  return Bluebird.try(() => {
    const sw = treeToShrinkwrap(tree)
    sw.requires = {}
    tree.requires.forEach(pkg => {
      sw.requires[pkg.package.name] = pkg.package.version
    })

    sw.install = (install||[]).filter(a => a.name).map(packageId)
    sw.remove = (remove||[]).filter(a => a.name).map(packageId)
    sw.diffs = {}
    diffs.forEach((action) => {
      const mutation = action[0]
      const child = action[1]
      if (mutation !== 'add' && mutation !== 'update' && mutation !== 'remove') return
      if (!sw.diffs[mutation]) sw.diffs[mutation] = []
      if (mutation === 'add') {
        sw.diffs[mutation].push({location: child.location})
      } else if (mutation === 'update') {
        sw.diffs[mutation].push({location: child.location, previous: packageId(child.oldPkg)})
      } else if (mutation === 'remove') {
        sw.diffs[mutation].push({previous: packageId(child)})
      }
    }) 
    return writeFile('audit.json', JSON.stringify(sw, null, 2))
  })
}
