"use strict"
var finishLogAfterCb = require("./finish-log-after-cb.js")

var decomposeActions = module.exports = function (actions, log, cb) {
  cb = finishLogAfterCb(log.newItem(log.name), cb)
  log.silly("decomposeActions", "Got", actions.length, "actions")
  var decomposed = []
  actions.forEach(function(action) {
      var cmd = action.shift()
      var pkg = action.shift()
      switch (cmd) {
        case "add":
          decomposed.push(["fetch",pkg])
          decomposed.push(["extract",pkg])
          decomposed.push(["preinstall",pkg])
          decomposed.push(["build",pkg])
          decomposed.push(["install",pkg])
          decomposed.push(["postinstall",pkg])
          decomposed.push(["test",pkg])
          decomposed.push(["finalize",pkg])
          break
        case "update":
          decomposed.push(["fetch",pkg])
          decomposed.push(["extract",pkg])
          decomposed.push(["preinstall",pkg])
          decomposed.push(["build",pkg])
          decomposed.push(["install",pkg])
          decomposed.push(["postinstall",pkg])
          decomposed.push(["test",pkg])
          decomposed.push(["finalize",pkg])
          break
        default:
          decomposed.push([cmd,pkg])
      }
  })
  actions.length = 0
  actions.push.apply(actions, decomposed)
  cb()
}
