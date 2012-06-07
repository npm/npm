// a fake registry server.

var http = require('http')
var server = http.createServer(handler)
var port = server.port = process.env.PORT || 1337
server.listen(port)

module.exports = server

server._expect = {}

var expect = {}
function handler (req, res) {
  var u = "* " + req.url
  , mu = req.method + " " + req.url
  , k = expect[mu] ? mu : expect[u] ? u : null

  if (!k) throw Error("unexpected request", req.method, req.url)
  expect[k] --

  if (Object.keys(expect).reduce(function (s, k) {
    return s + expect[k]
  }, 0) === 0) server.close()

  res.json = json
  server._expect[k](req, res)
}

function json (o) {
  this.setHeader('content-type', 'application/json')
  this.end(JSON.stringify(o))
}

server.expect = function (method, u, fn) {
  if (typeof u === "function") {
    fn = u
    u = method
    method = "*"
  }
  u = method + " " + u
  server._expect[u] = fn
  expect[u] = expect[u] || 0
  expect[u] ++
}
