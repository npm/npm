var npa = require("npm-package-arg")

module.exports = function checkForLocalDependencies(pkgData) {
  return filterDepByType(pkgData.dependencies, "local")
      .concat(filterDepByType(pkgData.devDependencies, "local"));
}

function filterDepByType(deps, type) {
  return Object.keys(deps || {}).reduce(function (acc, name) {
    var spec = name + "@" + deps[name];
    if (npa(spec).type === type) {
      acc.push(spec)
    }
    return acc
  }, [])
}
