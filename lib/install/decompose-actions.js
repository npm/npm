"use strict"

module.exports = function (differences, decomposed, log, next) {
  differences.forEach(function (action) {
      var cmd = action[0]
      var pkg = action[1]
      switch (cmd) {
        case "add":
        case "update":
          decomposed.push(["fetch", pkg])
          decomposed.push(["extract", pkg])
          decomposed.push(["preinstall", pkg])
          decomposed.push(["build", pkg])
          decomposed.push(["install", pkg])
          decomposed.push(["postinstall", pkg])
          decomposed.push(["test", pkg])
          decomposed.push(["finalize", pkg])
          break
        case "remove":
          // todo
        default:
          decomposed.push([cmd, pkg])
      }
  })
  log.finish()
  next()
}
