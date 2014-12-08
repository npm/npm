"use strict"
var assert = require("assert")
var path = require("path")
var chain = require("slide").chain
var asyncMap = require("slide").asyncMap
var crypto = require("crypto");
var finishLogAfterCb = require("./finish-log-after-cb.js")
var addParentToErrors = require("./add-parent-to-errors.js")

var actions = {}

actions.fetch       = require("./action/fetch.js")
actions.extract     = require("./action/extract.js")
actions.build       = require("./action/build.js")
actions.test        = require("./action/test.js")
actions.preinstall  = require("./action/preinstall.js")
actions.install     = require("./action/install.js")
actions.postinstall = require("./action/postinstall.js")
actions.prepublish  = require("./action/prepublish.js")
actions.finalize    = require("./action/finalize.js")
actions.remove      = require("./action/remove.js")

Object.keys(actions).forEach(function(K){
  var action = actions[K]
  actions[K] = function (buildpath, pkg, log, cb) {
    return action(buildpath, pkg, log, addParentToErrors(pkg.parent, cb))
  }
})

function addParentOnErrorCb(fn) {
  return function (buildpath, pkg, log, cb) {
    return fn(buildpath, pkg, log, addParentToErrors(log, pkg.parent, cb))
  }
}

var md5hex = function () {
    var hash = crypto.createHash("md5");
    for (var ii=0; ii<arguments.length; ++ii) hash.update(""+arguments[ii])
    return hash.digest("hex")
}

function prepareAction(staging, log) {
  return function (action) {
    var cmd = action[0]
    var pkg = action[1]
    assert(actions[cmd])
    var buildpath = path.resolve(
      staging
    , pkg.package.name + "-" + md5hex(pkg.realpath)
    )
    return [actions[cmd], buildpath, pkg, log.newGroup(cmd+":"+pkg.package.name)]
  }
}

exports.actions = actions

exports.doSerial = function (type, staging, actions, log, cb) {
  actions = actions
    .filter(function(V) { return V[0]==type })
    .sort(function(A,B) {
      var a = A[1].path ? A[1].path : A[1]
      var b = B[1].path ? B[1].path : B[1]
      return a > b ? 1 : a < b ? -1 : 0
    })
  log.silly("doSerial","%s %d",type,actions.length)
  chain(actions.map(prepareAction(staging,log)), finishLogAfterCb(log, cb))
}

exports.doParallel = function (type, staging, actions, log, cb) {
  actions = actions.filter(function(V) { return V[0]==type })
  log.silly("doParallel",type+" "+actions.length)
  asyncMap(actions.map(prepareAction(staging,log)), function(todo,next){
      var cmd = todo.shift()
      todo.push(next)
      cmd.apply(null, todo)
    }
  , finishLogAfterCb(log,cb))
}
