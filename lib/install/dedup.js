"use strict"
function dumpPackageList(list) {
  return list.map(function(P){return P.package.name}).join("/")
}

module.exports = function (tree,cb) {
  console.log("DEDUPTREE", dumpPackageList([tree]))
  /*
      1. Make a list of versions of all packages installed
        a. For each package, store its version requirements
           and loc in tree
      2. Filter out packages only required once
  */
  // Build a flat list of all packages we're going to install
  var packages = {}
  var makeList = function (T) {
    T.children.forEach(function(C) {
      if (!packages[C.package.name]) packages[C.package.name] = []
      packages[C.package.name].push(C)
      makeList(C)
    })
  }
  makeList(tree)

/*
  console.log('Flat deps', '\n    '+Object.keys(packages).map(function(P){
    return packages[P].map(function(R){
      return dumpPackageList(moduleRequirePath(R))
    }).join(', ')
  }).join('\n    ')+'\n')
*/
  // Remove non-duplicates, convert to array
  packages =
    Object.keys(packages)
          .filter(function(N){ return packages[N].length > 1 })
          .map(function (N){ return packages[N] })

/*
  console.log('Non-duplicates removed', packages.map(function(P){
    return P.map(function(R){
      return dumpPackageList(moduleRequirePath(R))
    }).join(', ')
  }).join('; '))
*/
  // Dedup
  var deduped = true
  while (deduped) {
    deduped = false
    packages.forEach(function (package) {
      var scanned = []
      package.forEach(function(P) {
        var R = P.package.requested
        // Exact matches are always deduped
        var exact = scanned.filter(function(O) {
          return R.type == O.package.requested.type &&
                 R.spec == O.package.requested.spec
        })
        // When the previously scanned package satisfies the current
        // packages spec, we can just use the previous package
        var oSatisfiesR = scanned.filter(function(O) {
           return exact.filter(function(P){ return P===O }).lenth==0 &&
                  ( ( (O.type=="range" || O.type=="version")
                    && semver.satisfies(R.package.version, O.spec) )
                  || (O.type=="tag" && O.package.version==R.package.version) )
        })
        // If the the previous package can't satisfy the current one
        // but the reverse is true then we'll take the new one
        var oSatisfiesR = scanned.filter(function(O) {
           return exact.filter(function(P){ return P===O }).lenth==0 &&
                  rSatisfiesO.filter(function(P){ return P===O }).lenth==0 &&
                  ( ( (O.type=="range" || O.type=="version")
                    && semver.satisfies(R.package.version, O.spec) )
                  || (O.type=="tag" && O.package.version==R.package.version) )
        })

        // TODO: packages neither extant version is acceptable,
        // we should build a range from both of them and see
        // if any version exists that would satisfy both. Doing
        // this will render this all async, so a slight refactor.

  //      console.log("Looking for",P.package.name,R.spec)
  //      console.log("           ", dumpPackageList(moduleRequirePath(P)))
        if (! match.length) return scanned.push(P)
        for (var ii=0; ii<match.length; ++ii) {
          var matched = match[ii]
          var lca = findLowestCommonAncestor(P, matched)

          // If any of the least common ancestor shares an incompatible
          // version of this dep, we need to skip trying to merge these
          // deps
          var lcaChildren = lca.children.filter(function (lcaChild) {
            return lcaChild.package.name == P.package.name
          })
          if (lcaChildren.length) continue

          // ok, remove the old deps from the previous locations
          P.parent.children = P.parent.children
            .filter(function(C) { return P !== C })
          matched.parent.children =  matched.parent.children
            .filter(function(C) { return matched !== C })

          // And move the new into place
          matched.parent = lca
          lca.children.push(matched)

          deduped = true

          // And we're done, short circuit
          return
        }
        // We didn't manage to make a match, add this to the dups list
        scanned.push(P)
      })
    })
  }
  cb()
}

// NOTE: We can't scan back further than an ancestor that contains a
// different version of the same module.
function findLowestCommonAncestor(A, B) {
  var aPath = moduleRequirePath(A)
  var bPath = moduleRequirePath(B)
  for (var ii=0; ii<aPath.length && ii <bPath.length; ++ii) {
    if (aPath[ii] !== bPath[ii]) return aPath[ii-1] || bPath[ii-1]
    var matchingChildren
      = aPath[ii].children.filter(function(C){
          C.package.name == A.package.name
        }).length
      + bPath[ii].children.filter(function(C){
          C.package.name == B.package.name
        }).length
    if (matchingChildren) return null
  }
  return null
}

function moduleRequirePath(mod) {
  var path = []
  while (mod && mod.parent) {
    path.unshift(mod)
    mod = mod.parent === mod ? null : mod.parent
  }
  path.unshift(mod)
  return path
}

