var resolve = require("path").resolve
var server = require("./server.js")
var RC = require("../../")

var REGISTRY = "http://localhost:" + server.port

module.exports = {
  port : server.port,
  registry : REGISTRY,
  freshClient : function freshClient(config) {
    config = config || {}
    config.cache = resolve(__dirname, "../fixtures/cache")
    config.registry = REGISTRY

    var client = new RC(config)
    server.log = client.log
    client.log.level = "silent"

    return client
  }
}
