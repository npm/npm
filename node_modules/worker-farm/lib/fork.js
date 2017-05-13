const childProcess = require('child_process')
    , childModule  = require.resolve('./child/index')

function fork (forkModule) {
  var child = childProcess.fork(childModule, {
          env: process.env
        , cwd: process.cwd()
      })

  child.send({ module: forkModule })

  // return a send() function for this child
  return {
      send  : function (data) {
        try {
          child.send(data)
        } catch (e) {
          // this *should* be picked up by onExit and the operation requeued
        }
      }
    , child : child
  }
}

module.exports = fork