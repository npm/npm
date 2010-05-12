
// utilities for working with the js-registry site.

exports.publish = publish
exports.tag = tag
exports.adduser = adduser
exports.get = get

var npm = require("../../npm")
  , http = require("http")
  , url = require("url")
  , log = require("./log")
  , uuid = require("./uuid")
  , sha = require("./sha")
  , sys = require("sys")
  , ini = require("./ini")
  , Buffer = require("buffer").Buffer
  , fs = require("fs")
  , path = require("path")

function get (project, version, cb) {
  if (!cb) cb = version, version = null
  if (!cb) cb = project, project = null
  if (!cb) throw new Error("No callback provided to registry.get")
  var uri = []
  uri.push(project || "")
  if (version) uri.push(version)
  GET(uri.join("/"), cb)
}

function tag (project, version, tag, cb) { PUT(project+"/"+tag, version, cb) }

function publish (data, cb) {
  // add the dist-url to the data, pointing at the tarball.
  // if the {name} isn't there, then create it.
  // if the {version} is already there, then fail.
  // then:
  // PUT the data to {config.registry}/{data.name}/{data.version}
  try { reg() }
  catch (ex) { return cb(ex) }

  var fullData =
    { _id : data.name
    , name : data.name
    , description : data.description
    , "dist-tags" : {}
    , versions : {}
    }
  fullData.versions[ data.version ] = data
  data._id = data.name+"-"+data.version
  var attURI = encodeURIComponent(data.name)
             + "/-/"
             + encodeURIComponent(data.name)
             + "-"
             + encodeURIComponent(data.version)
             + ".tgz"
  data.dist = { "tarball" : url.resolve(npm.config.get("registry"), attURI) }

  // first try to just PUT the whole fullData, and this will fail if it's
  // already there, because it'll be lacking a _rev, so couch'll bounce it.
  PUT(encodeURIComponent(data.name), fullData, function (er, parsed, json, response) {
    // get the rev and then upload the attachment
    // a 409 is expected here, if this is a new version of an existing package.
    if (er
        && !(response && response.statusCode === 409)
        && !( parsed
            && parsed.reason === "must supply latest _rev to update existing package"
            )
    ) {
      return log.er(cb, "Failed PUT response "+(response && response.statusCode))(er)
    }
    var sendVersionAgain = !!er
    GET(encodeURIComponent(data.name), function (er, d) {
      if (er) return cb(er)
      
      var rev = d && d._rev
        , tarball = path.join(npm.cache, data.name, data.version, "package.tgz")
        , dataURI = encodeURIComponent(data.name)+"/"+encodeURIComponent(data.version)
      log(tarball, "tarball")
      attURI += "/" + rev
      upload(attURI, tarball, function (er) {
        if (!sendVersionAgain) return log.er(cb, "Couldn't send tarball")(er)
        PUT(dataURI, data, log.er(cb, "Error sending version data"))
      })
    })
  })
}
function request (method, where, what, cb) {
  if ( typeof what === "function" && !cb ) cb = what, what = null
  try { reg() }
  catch (ex) { return cb(ex) }

  var authRequired = what && !where.match(/^\/?adduser\/org\.couchdb\.user:/)
  where = url.resolve(npm.config.get("registry"), where)
  var u = url.parse(where)
    , https = u.protocol === "https:"
    , auth = authRequired && npm.config.get("auth")

  if (authRequired && !auth) {
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
      what = what.data
      headers["content-type"] = "application/octet-stream"
    } else {
      what = JSON.stringify(what)
      headers["content-type"] = "application/json"
    }
    headers["content-length"] = what.length
  }

  var client = http.createClient(u.port || (https ? 443 : 80), u.hostname, https)
    , request = client.request(method, u.pathname, headers)
  request.addListener("response", function (response) {
    // if (response.statusCode !== 200) return cb(new Error(
    //   "Status code " + response.statusCode + " from PUT "+where))
    var data = ""
    response.setEncoding ? response.setEncoding("utf8")
                         : response.setBodyEncoding("utf8")
    response.addListener("data", function (chunk) { data += chunk })
    response.addListener("end", function () {
      var parsed
      try {
        parsed = JSON.parse(data)
      } catch (ex) {
        ex.message += "\n" + data
        return cb(ex, null, data, response)
      }
      if (parsed && parsed.error) return cb(new Error(
        parsed.error + (" "+parsed.reason || "")), parsed, data, response)
      cb(null, parsed, data, response)
    })
  })
  if (what) request.write(what, "ascii")
  request.end()
}

function GET (where, cb) { request("GET", where, cb) }
function PUT (where, what, cb) { request("PUT", where, what, cb) }

function upload (where, filename, cb) {
  new File(filename, function (er, f) {
    if (er) log.er(cb, "Couldn't open "+filename)(er)
    PUT(where, f, cb)
  })
}
function File (name, cb) {
  var f = this
  f.name = name
  if (f.loaded) return cb(null, f)
  fs.stat(f.name, function (er, stat) {
    if (er) return log.er(cb, "doesn't exist "+f.name)(er)
    fs.readFile(f.name, function (er, data) {
      if (er) return log.er(cb, "problem reading "+f.name)(er)
      f.data = data
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

function adduser (username, password, email, callback) {
  var salt = uuid.generate()
    , userobj =
      { _id : 'org.couchdb.user:'+username
      , name : username
      , type : "user"
      , roles : []
      , salt : salt
      , password_sha : sha.hex_sha1(password + salt)
      , email : email
      }
  PUT
    ( '/adduser/org.couchdb.user:'+encodeURIComponent(username)
    , userobj
    , function (error, data, json, response) {
        // if the error is a 409, then update the rev.
        if (error || response && response.statusCode !== 201) {
          log(response && response.statusCode, "response")
          log(error, "error")
          return callback(new Error( (response && response.statusCode) + " "+
            "Could not create user "+error+'\n'+JSON.stringify(data)))
        }
        callback()
      }
    )
}
