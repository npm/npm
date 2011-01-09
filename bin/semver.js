// Standalone semver comparison program.
// Exits successfully and prints matching version(s) if
// any supplied version is valid and passes all tests.

var argv = process.argv.slice(2)
  , versions = []
  , range = []
  , gt = []
  , lt = []
  , eq = []
  , semver = require("../lib/utils/semver")

main()

function main () {
  if (!argv.length) return help()
  while (argv.length) {
    switch (argv.shift()) {
      case "-v": case "--version":
        versions.push(argv.shift())
        break
      case "-r" : case "--range":
        range.push(argv.shift())
        break
      default:
        return help()
    }
  }
  versions = versions.filter(semver.valid)
  for (var i = 0, l = range.length; i < l ; i ++) {
    versions = versions.filter(function (v) {
      return semver.satisfies(v, range[i])
    })
    if (!versions.length) return fail()
  }
  return success(versions)
}

function fail () { process.exit(1) }

function success () {
  versions.sort(semver.compare).forEach(function (v,i,_) { console.log(v) })
}

function help () {
  console.log(["Usage: semver -v <version> [-r <range>]"
              ,"Test if version(s) satisfy the supplied range(s),"
              ,"and sort them."
              ,""
              ,"Multiple versions or ranges may be supplied."
              ,""
              ,"Program exits successfully if all versions satisfy all"
              ,"ranges and are valid, and prints all satisfying versions."
              ,"If no versions are valid, or ranges are not satisfied,"
              ,"then exits failure."
              ,""
              ,"Versions are printed in ascending order, so supplying"
              ,"multiple versions to the utility will just sort them."
              ].join("\n"))
}


