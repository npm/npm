const semver = require('semver')
const npmFacade = require('./npmfacade')

function matchSemverToVersion(range1, range2) {
  // console.log('comparing range ', `${range1} and ${range2}`)
  return semver.intersects(range1, range2)
}

function findFeasibleUpdate(targetPackage, targetVersion, dependantsChain) {
  return npmFacade.runNpmCommand(`info ${dependantsChain[0]}`)
    .then(info => {
      const range1 = info.dependencies[targetPackage] || info.devDependencies[targetPackage]
      if (!range1) {
        console.log(`possible fix: ${targetPackage} doesn't seem to be a dependency in the latest version of ${dependantsChain[0]}`)
        console.log(`  you might be able to fix it by updating ${dependantsChain[0]} to latest version`)
        return ['r', 'i']
      }
      if (dependantsChain.length < 1) {
        console.log('ran out of parents to go up, this looks fixed, how did we get here?');
        return ['d']
        //TODO: figure out how this can happen
      }
      if (matchSemverToVersion(range1, targetVersion)) {
        // semver range includes the fix, go up
        const newTarget = dependantsChain.shift()
        // This is a bit strict, maybe we wouldn't have to force an update to latest on everything in the chain, but it'd require iterating over all versions between what's used by dependant and latest
        const newTargetVersion = info['dist-tags'].latest
        return findFeasibleUpdate(newTarget, newTargetVersion, dependantsChain)
      } else {
        //TODO: deduplicate this!
        console.log(`possible fix: update ${targetPackage} in ${dependantsChain[0]} to ${targetVersion}`)
        console.log(`  you can submit a PR or see if an issue exists here: ${info.bugs.url}`)
        return ['r', 'i']
      }
    })
}


module.exports = {
  findFeasibleResolutions({ action, advisories }) {
    return Promise.all(action.resolves
      // .filter(r => r.path === 'jshint>lodash')
      .map(issue => {
        const adv = advisories[issue.id]
        const dependantsChain = issue.path.split('>').reverse()
        dependantsChain.shift()
        return findFeasibleUpdate(adv.module_name, adv.patched_versions, dependantsChain)
      })).then(setsOfOptions =>
        Array.from(setsOfOptions.reduce((all, o) => {
          o.map(all.add, all)
          return all;
        }, new Set()))
      )

  }
}
