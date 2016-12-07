var fetchPackageMetadata = require('../fetch-package-metadata')

function getLatestNpmVersion (cb) {
  fetchPackageMetadata('npm@latest', '.', function (e, d) {
    cb(e, d.version)
  })
}

module.exports = getLatestNpmVersion
