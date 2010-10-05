
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
  , fs = require("../graceful-fs")

function request (method, where, what, cb) {
  log.verbose(where||"/", method)

  if ( typeof what === "function" && !cb ) cb = what, what = null
  try { reg() }
  catch (ex) { return cb(ex) }

  var authRequired = what && !where.match(/^\/?adduser\/org\.couchdb\.user:/)
                   || where.match(/^\/?adduser\/org\.couchdb\.user:([^\/]+)\/-rev/)
                   || method === "DELETE"
  where = url.resolve(npm.config.get("registry"), where)
  var u = url.parse(where)
    , proxyConfig = npm.config.get("proxy")
  if (proxyConfig) {
    if (!proxyConfig.match(/^https?:\/\//)) {
      proxyConfig = u.protocol+"//"+proxyConfig
    }
    var proxy = (proxyConfig) ? url.parse(proxyConfig) : null
    if (!proxy.host) return cb(new Error("Bad proxy config: "+proxyConfig))
  }
  var https = (proxy || u).protocol === "https:"
    , port = (proxy || u).port || (https ? 443 : 80)
    , hostname = (proxy || u).hostname
    , client = http.createClient(port, hostname, https)
    , auth = authRequired && npm.config.get("_auth")
    , path = proxy ? u.href : u.pathname

  if (authRequired && !auth) {
    return cb(new Error(
      "Cannot insert data into the registry without authorization\n"
      + "See: npm-adduser(1)"))
  }
  if (auth && !https) {
    log.warn("Sending authorization over insecure channel.")
  }
  var headers = { "host" : u.host
                , "accept" : "application/json"
                }
  if (auth) headers.authorization = "Basic " + auth
  if (proxy && proxy.auth) {
    headers["proxy-authorization"] =
      "Basic " + (new Buffer(proxy.auth).toString("base64"))
  }
  if (what) {
    if (what instanceof File) {
      log.verbose(what.name, "uploading")
      headers["content-type"] = "application/octet-stream"
    } else {
      log.silly(what,"writing json")
      what = new Buffer(JSON.stringify(what))
      headers["content-type"] = "application/json"
    }
    headers["content-length"] = what.length
  } else {
    headers["content-length"] = 0
  }
  log.silly(headers, "headers")

  var request = client.request(method, path, headers)
  request.on("error", cb)
  request.on("clientError", cb)
  request.on("response", function (response) {
    // if (response.statusCode !== 200) return cb(new Error(
    //   "Status code " + response.statusCode + " from PUT "+where))
    var data = ""
    response.on("error", cb)
    response.on("clientError", cb)
    response.on("data", function (chunk) {
      log.silly(chunk+"", "chunk")
      data += chunk
    })
    response.on("end", function () {
      var parsed
      try {
        parsed = JSON.parse(data)
      } catch (ex) {
        ex.message += "\n" + data
        log.error("error parsing json", "registry")
        return cb(ex, null, data, response)
      }
      if (parsed && parsed.error) {
        var w = url.parse(where).pathname.substr(1)
        return cb(new Error(
            parsed.error + (" "+parsed.reason || " ") + ": "+w
          ), parsed, data, response)
      }
      cb(null, parsed, data, response)
    })
  })
  if (what instanceof File) {
    var size = Math.min(what.length, 1024*1024*1024)
      , remaining = what.length
    log.verbose(what.length, "bytes")
    ;(function W () {
      var b = new Buffer(size)
      try {
        var bytesRead = fs.readSync(what.fd, b, 0, b.length, null)
      } catch (er) {
        return log.er(cb, "Failure to read tarball")(er)
      }
      remaining -= bytesRead
      if (bytesRead) {
        log(bytesRead, "read")
        log(remaining, "remain")
        return (
            request.write(bytesRead === b.length ? b : b.slice(0, bytesRead))
          ) ? W()
            : request.on("drain", function DRAIN () {
                log.silly(remaining, "drain")
                request.removeListener("drain", DRAIN)
                W()
              })
      }
      if (!remaining) {
        request.end()
        log.verbose(what.name, "written to uploading stream")
        log.verbose("Not done yet! If it hangs/quits now, it didn't work.", "upload")
        return
      }
      // wtf!? No bytes read, but also bytes remaining.
      return cb(new Error("Some kind of weirdness reading the file"))
    })()
    return
  } else if (typeof what === "string" || Buffer.isBuffer(what)) {
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
    PUT(where, f, function (er) {
      log.info("done with upload", "publish")
      cb(er)
    })
  })
}
function File (name, cb) {
  var f = this
  f.name = name
  if (f.loaded) return cb(null, f)
  fs.stat(f.name, function (er, stat) {
    if (er) return log.er(cb, "doesn't exist "+f.name)(er)
    log.silly(stat, "stat "+name)
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
