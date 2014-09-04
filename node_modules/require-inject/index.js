"use strict";

module.exports = function (toLoad, mocks) {
  // Inject all of our mocks
  Object.keys(mocks).forEach(function(name){
    var path = require.resolve(name)
    require.cache[path] = {exports: mocks[name]}
  })

  var toLoadPath = require.resolve(toLoad)

  // remove any unmocked version previously loaded
  delete require.cache[toLoadPath]
  // load our new version using our mocks
  var mocked = require(toLoadPath)
  // remove our version from the cache so anyone else gets the real thing
  delete require.cache[toLoadPath]

  // Remove our injected mocks
  Object.keys(mocks).forEach(function(name){
      delete require.cache[require.resolve(name)]
  })
  return mocked
}
