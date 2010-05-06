
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

function get (project, version, cb) {
  if (typeof version === "function") {
    cb = version
    version = null
  }
  GET(project+"/"+(version || ""), cb)
}

function tag (project, version, tag, cb) { PUT(project+"/"+tag, version, cb) }

function publish (data, tarball, cb) {
  // add the dist-url to the data, pointing at the tarball.
  // if the {name} isn't there, then create it.
  // if the {version} is already there, then fail.
  // then:
  // PUT the data to {config.registry}/{data.name}/{data.version}
  try {
    reg()
  } catch (ex) {
    return cb(ex)
  }
  var fullData =
    { _id : data.name
    , name : data.name
    , description : data.description
    , "dist-tags" : {}
    , versions : {}
    }
  fullData.versions[ data.version ] = data
  data._id = data.name+"-"+data.version
  data.dist = { "tarball" : tarball }

  // first try to just PUT the whole fullData, and this will fail if it's
  // already there, because it'll be lacking a _rev, so couch'll bounce it.
  PUT(data.name, fullData, function (er) {
    if (!er) return cb()
    // there was an error, so assume the fullData is already there.
    // now try to create just this version.  This time, failure
    // is not ok.
    // Note: the first might've failed for a down host or something,
    // in which case this will likely fail, too.  If the host was down for the
    // first req, but now it's up, then this may fail for not having the
    // project created yet, or because the user doesn't have access to it.
    PUT(encodeURIComponent(data.name)+"/"+encodeURIComponent(data.version)
      , data
      , function (er) {
        if (er) return cb(er)
        cb()
      })
  })
}

function request (method, where, what, cb) {
  if (typeof what === "function" && !cb) {
    cb = what
    what = null
  }
  try { reg() }
  catch (ex) { return cb(ex) }

  var authRequired = what && !where.match(/^\/adduser\/org\.couchdb\.user:/)
  where = url.resolve(npm.config.get("registry"), where)
  var u = url.parse(where)
    , https = u.protocol === "https:"
    , auth = https && npm.config.get("auth")

  if (authRequired && !auth) {
    return cb(new Error(
      + "Cannot insert data into the registry without authorization and https\n"
      + "See: npm-adduser(1)"))
  }
  var headers = { "content-type" : "application/json"
                , "host" : u.host
                , "accept" : "application/json"
                }
  if (auth) headers.authorization = "Basic " + auth
  if (what) {
    what = JSON.stringify(what)
    headers["content-length"] = Buffer.byteLength(what)
  }

  var client = http.createClient(u.port || (https ? 443 : 80), u.hostname, https)
    , request = client.request(method, u.pathname, headers)
  request.addListener("response", function (response) {
    // if (response.statusCode !== 200) return cb(new Error(
    //   "Status code " + response.statusCode + " from PUT "+where))
    var data = ""
    log("response")
    response.setBodyEncoding("utf8")
    response.addListener("data", function (chunk) { data += chunk })
    response.addListener("end", function () {
      try {
        data = JSON.parse(data)
      } catch (ex) {
        ex.message += "\n" + data
        return cb(ex, data, response)
      }
      if (data && data.error) return cb(new Error(
        data.error + (" "+data.reason || "")))
      cb(null, data, response)
    })
  })
  if (what) request.write(what, "utf8")
  request.end()
}

function GET (where, cb) { request("GET", where, cb) }
function PUT (where, what, cb) { request("PUT", where, what, cb) }

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
    , function (error, data, response) {
        // if the error is a 409, then update the rev.
        if (error || response.statusCode !== 201) {
          return callback(new Error(
            "Could not create user "+error+'\n'+data))
        }
        callback()
      }
    )
}
