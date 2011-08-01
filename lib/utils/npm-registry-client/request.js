
module.exports = request
request.GET = GET
request.PUT = PUT
request.reg = reg
request.upload = upload

var npm = require("../../../npm")
  , http
  , https
  , url = require("url")
  , log = require("../log")
  , ini = require("../ini")
  , fs = require("graceful-fs")
  , rm = require("../rm-rf")
  , asyncMap = require("slide").asyncMap
  , proxyify = require("../proxyify")
  , warnedAuth = false

  , iniParser = require("../ini-parser")
  , output = require("../output")
  , newloctimeout = 0
  , checkingCert = {}
  , certCheckWait = 200

function request (method, where, what, etag, nofollow, cb_) {
  log.verbose(where||"/", method)

  if (where.match(/^\/?favicon.ico/)) {
    return cb_(new Error("favicon.ico isn't a package, it's a picture."))
  }
  if (typeof cb_ !== "function") cb_ = nofollow, nofollow = false
  if (typeof cb_ !== "function") cb_ = etag, etag = null
  if (typeof cb_ !== "function") cb_ = what, what = null
  var registry = reg()
  if (registry instanceof Error) return cb_(registry)

  // Since there are multiple places where an error could occur,
  // don't let the cb be called more than once.
  var errState = null
  function cb (er) {
    if (errState) return
    if (er) errState = er
    cb_.apply(null, arguments)
  }

  var adduserChange = /^\/?-\/user\/org\.couchdb\.user:([^\/]+)\/-rev/
    , adduserNew = /^\/?-\/user\/org\.couchdb\.user:([^\/]+)/
    , authRequired = (what || npm.config.get("always-auth"))
                      && !where.match(adduserNew)
                   || where.match(adduserChange)
                   || method === "DELETE"
  if (!where.match(/^https?:\/\//)) {
    log.verbose(where, "raw, before any munging")

    var q = where.split("?")
    where = q.shift()
    q = q.join("?")

    if (where.charAt(0) !== "/") where = "/" + where
    where = "." + where.split("/").map(function (p) {
      p = p.trim()
      if (p.match(/^org.couchdb.user/)) {
        return p.replace(/\//g, encodeURIComponent("/"))
      }
      return encodeURIComponent(p)
    }).join("/")
    if (q) where += "?" + q
    log.verbose([registry, where], "url resolving")
    where = url.resolve(registry, where)
    log.verbose(where, "url resolved")
  } else {
    log.verbose(where, "no need to resolve")
  }

  var remote = url.parse(where)
    , secure = remote.protocol === "https:"
    , port = remote.port || (secure ? 443 : 80)
    , hostname = remote.hostname
    , auth = authRequired && npm.config.get("_auth")

  if (secure && checkingCert[remote.hostname]) {
    // don't make a request while validating the certificate.
    return setTimeout(function W () {
      if (errState) return
      if (checkingCert[remote.hostname]) {
        return setTimeout(W, certCheckWait ++)
      }
      certCheckWait = 0
      request(method, where, what, etag, nofollow, cb_)
    }, certCheckWait ++)
  }

  log.verbose(remote, "url parsed")
  if (port !== (secure ? 443 : 80)) hostname += ":" + port

  if (authRequired && !auth) {
    return cb(new Error(
      "Cannot insert data into the registry without authorization\n"
      + "See: npm-adduser(1)"))
  }

  if (auth && !secure && !warnedAuth) {
    warnedAuth = true
    log.warn("Sending authorization over insecure channel.")
  }

  var headers = { "accept" : "application/json" }
  if (auth) headers.authorization = "Basic " + auth
  if (what) {
    if (what instanceof File) {
      log.verbose(what.name, "uploading")
      headers["content-type"] = "application/octet-stream"
    } else {
      delete what._etag
      log.silly(what,"writing json")
      what = new Buffer(JSON.stringify(what))
      headers["content-type"] = "application/json"
    }
    headers["content-length"] = what.length
  } else {
    headers["content-length"] = 0
  }

  if (etag) {
    log.verbose(etag, "etag")
    headers[method === "GET" ? "if-none-match" : "if-match"] = etag
  }

  if (!remote.protocol) log.warn(remote, "No protocol?")

  var opts = { method: method
             , headers: headers
             , path: (remote.pathname||"/")
                   + (remote.search||"")
                   + (remote.hash||"")
             , host: remote.hostname
             , secure: remote.protocol
                       && remote.protocol.toLowerCase() === "https:"
             , port: remote.port
             }
  if (!opts.port) opts.port = opts.secure ? 443 : 80
  if (opts.port !== (opts.secure ? 443 : 80)) {
    opts.headers.host = opts.headers.host || opts.host
    opts.headers.host += ":" + opts.port
  }

  opts = proxyify(npm.config.get("proxy"), remote, opts)
  if (!opts) return cb(new Error("Bad proxy config: "+npm.config.get("proxy")))

  if (opts.secure) https = https || require("https")
  else http = http || require("http")

  var req = (opts.secure ? https : http).request(opts, function (response) {
    log.verbose(where, "response")

    if (opts.secure) checkCert(cb, response, remote.hostname)

    var data = ""
    response.on("error", log.er(cb, "response error from "+where))

    response.on("data", function (chunk) {
      log.silly(chunk+"", "chunk")
      data += chunk
    })

    response.on("end", function () {
      if (!nofollow
          && (response.statusCode === 301 || response.statusCode === 302)) {
        // relative redirects SHOULD be disallowed, but alas...
        var newLoc = response.headers.location
        newLoc = newLoc && url.resolve(where, newLoc)
        log.verbose(newLoc, "redirect")
        if (!newLoc) return cb(new Error(
          response.statusCode + " status code with no location"))
        //FIXME: wtf? why does this timeout make it work?
        return setTimeout(function () {
          log.verbose(newLoc, "redirect fer reals")
          request(method, newLoc, what, etag,
                       log.er(cb, "Failed to fetch "+newLoc))
        }, 1000*(global.newloctimeout ++))
      }

      var parsed
      if (response.statusCode !== 304) {
        try {
          parsed = JSON.parse(data)
        } catch (ex) {
          ex.message += "\n" + data
          log.verbose(data, "bad json")
          log.error("error parsing json", "registry")
          return cb(ex, null, data, response)
        }
      }

      var er = null
      if (parsed && response.headers.etag) {
        parsed._etag = response.headers.etag
      }

      if (parsed && parsed.error) {
        var w = url.parse(where).pathname.substr(1)
        if (parsed.error === "not_found") {
          w = w.split("/")
          name = w[w.indexOf("_rewrite") + 1]
          er = new Error("404 Not Found: "+name)
          er.errno = npm.E404
          er.pkgid = name
        } else {
          er = new Error(
            parsed.error + " " + (parsed.reason || "") + ": " + w)
        }
      } else if (method !== "HEAD" && method !== "GET") {

        // invalidate cache
        // This is irrelevant for commands that do etag caching, but
        // ls and view also have a timed cache, so this keeps the user
        // from thinking that it didn't work when it did.
        // Note that failure is an acceptable option here, since the
        // only result will be a stale cache for some helper commands.
        var path = require("path")
          , p = url.parse(where).pathname.split("/")
          , _ = "/"
          , caches = p.map(function (part) {
              return _ = path.join(_, part)
            }).map(function (cache) {
              return path.join(npm.cache, cache, ".cache.json")
            })

        // if the method is DELETE, then also remove the thing itself.
        // Note that the search index is probably invalid.  Whatever.
        // That's what you get for deleting stuff.  Don't do that.
        if (method === "DELETE") {
          p = p.slice(0, p.indexOf("-rev"))
          caches.push(path.join(npm.cache, p.join("/")))
        }

        asyncMap(caches, rm, function () {})
      }
      return cb(er, parsed, data, response)
    })
  }).on("error", cb)

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
            req.write(bytesRead === b.length ? b : b.slice(0, bytesRead))
          ) ? W()
            : req.on("drain", function DRAIN () {
                log.silly(remaining, "drain")
                req.removeListener("drain", DRAIN)
                W()
              })
      }
      if (!remaining) {
        req.end()
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
    req.write(what)
  }

  req.end()
}

// usually synchronous.  The cb arg is just so that we can abort easily
function checkCert (cb, res, hostname) {
  // see if we have a fingerprint for this hostname already.
  var key = "npm:fingerprint:" + hostname
    , cert = res.connection.getPeerCertificate()
    , fp = cert.fingerprint
    , saved = npm.config.get(key)

  if (!fp) return cb(new Error(
    "No SSL fingerprint for "+hostname))

  if (saved === fp) return

  if (checkingCert[hostname]) {
    res.pause()
    checkingCert[hostname].push([cb, res])
    return
  }

  checkingCert[hostname] = [[cb, res]]
  res.pause()

  if (saved) {
    // have some saved key, and it's not this one.
    // Not allowed.
    log.warn(prettyCert(cert).trim(), "bad host key")
    return cb([ ""
              , "Incorrect fingerprint for "+hostname
              , ""
              , "Found:  " + fp
              , "Wanted: " + saved
              , ""
              , "Run the following command to delete the stored key,"
              , "and review the new credentials for "+hostname
              , ""
              , "    npm set " + key + " null"
              ].join("\n"))
  }

  var yes = ""
  function yn (chunk) {
    yes += chunk
    if (yes.match(/[\r\n]+/)) {
      process.stdin.removeListener("data", yn)
      process.stdin.pause()
      yes = yes.split(/[\r\n]+/)[0].trim()
      if (yes.match(/^(y(es)?)?$/i)) {
        return npm.commands.config(["set", key, fp], function (er) {
          log.warn("saved fingerprint", hostname)
          checkingCert[hostname].forEach(function (c) {
            c[1].resume()
          })
          delete checkingCert[hostname]
        })
      }
      cb(new Error("Rejected new fingerprint"))
    }
  }

  log.warn("New host fingerprint",hostname)
  var y = npm.config.get("yes")
  if (y) return yn("yes\n")
  else if (y === false) return yn("no\n")

  process.stdin.on("data", yn)
  process.stdin.resume()

  output.write( [ ""
                , "Certificate info:"
                , ""
                , prettyCert(cert)
                , ""
                , "Is this acceptable? (yes)" ].join("\n"), function (er) {
    if (er) return cb(er)
  })
}

function prettyCert (cert) {
  return iniParser.stringify({ "-":
                               { valid_from: cert.valid_from
                               , valid_to: cert.valid_to
                               , fingerprint: cert.fingerprint }
                             , issuer: cert.issuer
                             , subject: cert.subject })
}

function GET (where, etag, nofollow, cb) {
  request("GET", where, null, etag, nofollow, cb)
}

function PUT (where, what, etag, nofollow, cb) {
  request("PUT", where, what, etag, nofollow, cb)
}

function upload (where, filename, etag, nofollow, cb) {
  if (typeof nofollow === "function") cb = nofollow, nofollow = false
  if (typeof etag === "function") cb = etag, etag = null

  new File(filename, function (er, f) {
    if (er) return log.er(cb, "Couldn't open "+filename)(er)
    PUT(where, f, etag, nofollow, function (er) {
      log.info("done with upload", "publish")
      cb(er)
    })
  })
}

function File (name, cb) {
  var f = this
  f.name = name
  if (f.loaded) return cb(null, f)
  log.info(f.name, "stat")
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
  if (!r) {
    return new Error("Must define registry URL before accessing registry.")
  }
  if (r.substr(-1) !== "/") r += "/"
  npm.config.set("registry", r)
  return r
}
