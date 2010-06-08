
module.exports = request
request.GET = GET
request.PUT = PUT
request.reg = reg
request.upload = upload

var npm = require("../../../npm")
  , http = require("http")
  , url = require("url")
  , log = require("../log")
  , ini = require("../ini")
  , Buffer = require("buffer").Buffer
  , fs = require("fs")

function request (method, where, what, cb) {
  log(where, method)
  if ( typeof what === "function" && !cb ) cb = what, what = null
  try { reg() }
  catch (ex) { return cb(ex) }

  var authRequired = what && !where.match(/^\/?adduser\/org\.couchdb\.user:/)
                   || method === "DELETE"
  where = url.resolve(npm.config.get("registry"), where)
  var u = url.parse(where)
    , https = u.protocol === "https:"
    , auth = authRequired && npm.config.get("auth")

  if (authRequired && !auth) {
    log("error for auth")
    return cb(new Error(
      "Cannot insert data into the registry without authorization and https\n"
      + "See: npm-adduser(1)"))
  }
  if (auth && !https) {
    log("Sending authorization over insecure channel.", "WARNING")
  }
  var headers = { "host" : u.host
                , "accept" : "application/json"
                }
  if (auth) headers.authorization = "Basic " + auth
  if (what) {
    if (what instanceof File) {
      log(what.name, "uploading")
      headers["content-type"] = "application/octet-stream"
    } else {
      what = JSON.stringify(what)
      headers["content-type"] = "application/json"
    }
    headers["content-length"] = what.length
  } else {
    headers["content-length"] = 0
  }

  var client = http.createClient(u.port || (https ? 443 : 80), u.hostname, https)
    , request = client.request(method, u.pathname, headers)
  request.addListener("response", function (response) {
    // if (response.statusCode !== 200) return cb(new Error(
    //   "Status code " + response.statusCode + " from PUT "+where))
    var data = ""
    response.addListener("data", function (chunk) { data += chunk })
    response.addListener("end", function () {
      var parsed
      try {
        parsed = JSON.parse(data)
      } catch (ex) {
        ex.message += "\n" + data
        log("error parsing json", "registry")
        return cb(ex, null, data, response)
      }
      if (parsed && parsed.error) return cb(new Error(
        parsed.error + (" "+parsed.reason || "")), parsed, data, response)
      cb(null, parsed, data, response)
    })
  })
  if (what instanceof File) {
    var b = new Buffer(what.length)
      , remaining = what.length
    log(what.length, "bytes")
    // FIXME: This only works if the tarball can fit in memory.
    // otherwise you'll get a FATAL ERROR from v8.
    ;(function W () {
      try {
        var bytesRead = fs.readSync(what.fd, b, 0, b.length, null)
      } catch (er) {
        return log.er(cb, "Failure to read tarball")(er)
      }
      remaining -= bytesRead
      if (bytesRead) {
        request.write(bytesRead === b.length ? b : b.slice(0, bytesRead))
      }
      if (!remaining) {
        request.end()
        return log(what.name, "uploaded")
      }
      setTimeout(W, 1)
    })()
    return
  } else if (typeof what === "string") {
    // just a json blob
    request.write(what)
  }
  request.end()
}
function GET (where, cb) { request("GET", where, cb) }
function PUT (where, what, cb) { request("PUT", where, what, cb) }

function upload (where, filename, cb) {
  new File(filename, function (er, f) {
    if (er) return log.er(cb, "Couldn't open "+filename)(er)
    PUT(where, f, cb)
  })
}
function File (name, cb) {
  var f = this
  f.name = name
  if (f.loaded) return cb(null, f)
  fs.stat(f.name, function (er, stat) {
    if (er) return log.er(cb, "doesn't exist "+f.name)(er)
    log(stat, "stat "+name)
    f.length = stat.size
    fs.open(f.name, "r", 0666, function (er, fd) {
      if (er) return log.er(cb, "Error opening "+f.name)(er)
      f.fd = fd
      cb(null, f)
    })
  })
}

function reg () {
  var r = npm.config.get("registry")
  if (!r) throw new Error(
    "Must define registry URL before accessing registry.")
  if (r.substr(-1) !== "/") {
    r += "/"
  }
  npm.config.set("registry", r)
  return r
}
