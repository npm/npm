
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

function get (project, version, cb) { registryGET(project+"/"+version, cb) }

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
    { "_id" : data.name
    , "name" : data.name
    , "description" : data.description
    , "dist-tags" : {}
    , "versions" : {}
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
    PUT(data.name+"/"+data.version, data, function (er) {
      if (er) return cb(er)
      cb()
    })
  })
}

function GET (where, cb) {
  reg()
  where = ini.config.registry + where
  var u = url.parse(where)
    , headers = { "host" : u.host
                , "accept" : "application/json"
                }
  if (ini.config.auth) {
    headers.authorization = 'Basic ' + ini.config.auth
  }
  log(u, "registryGET")
  var client = http.createClient(u.port || (u.protocol === "https:" ? 443 : 80), u.hostname)
  if (u.protocol === "https:") {
    client.setSecure("X509_PEM")
  }
  var request = client.request("GET", u.pathname, headers)

  request.addListener("response", function (response) {
    // if (response.statusCode !== 200) return cb(new Error(
    //   "Status code " + response.statusCode + " from PUT "+where))
    var data = ""
    response.setBodyEncoding("utf8")
    response.addListener("data", function (chunk) { data += chunk })
    response.addListener("end", function () {
      try {
        data = JSON.parse(data)
      } catch (ex) {
        ex.message += "\n" + data
        return cb(ex, data, response)
      }
      if (data.error) return cb(new Error(
        data.error + (" "+data.reason || "")))
      cb(null, data, response)
    })
  })
  request.end()
}


function PUT (where, what, cb) {
  reg()
  what = JSON.stringify(what)
  log(where, "registryPUT")
  where = ini.config.registry + where

  var u = url.parse(where)
    , headers = { "content-type" : "application/json"
                , "host" : u.host
                , "content-length" : what.length
                }
  if (ini.config.auth) {
    headers.authorization = 'Basic ' + ini.config.auth
  }
  log(sys.inspect(u), "registryPUT")
  log(u.port || (u.protocol === "https:" ? 443 : 80), "registryPUT port")

  var client = http.createClient(u.port || (u.protocol === "https:" ? 443 : 80), u.hostname)
  if (u.protocol === "https:") {
    client.setSecure("X509_PEM")
  }
  var request = client.request("PUT", u.pathname, headers)

  log(sys.inspect(headers), "registryPUT headers")

  request.addListener("response", function (response) {
    // if (response.statusCode !== 200) return cb(new Error(
    //   "Status code " + response.statusCode + " from PUT "+where))
    var data = ""
    response.setBodyEncoding("utf8")
    response.addListener("data", function (chunk) { data += chunk })
    response.addListener("end", function () {
      log(data, "registryPUT")
      try {
        data = JSON.parse(data)
      } catch (ex) {
        ex.message += "\n" + data
        return cb(ex, data, response)
      }
      if (data.error) return cb(new Error(
        data.error + (" "+data.reason || "")))
      cb(null, data, response)
    })
  })
  request.write(what, "utf8")
  request.end()
}

function reg () {
  if (!ini.config.registry) throw new Error(
    "Must define registry before publishing.")
  log(ini.config.registry, "registry")
  if (ini.config.registry.substr(-1) !== "/") {
    ini.config.registry += "/"
  }
}

function adduser (username, password, email, callback) {
  var salt = uuid.generate()
  var userobj =
    { '_id' : 'org.couchdb.user:'+username
    , name : username
    , type : "user"
    , roles : []
    , salt : salt
    , password_sha : sha.hex_sha1(password + salt)
    , email : email
    }
  PUT('/adduser/org.couchdb.user:'+username, userobj, function (error, data, response) {
    // if the error is a 409, then update the rev.
    if (error || response.statusCode !== 201) {
      callback(new Error(
        "Could not create user "+error+'\n'+data))
    } else {
      callback()
    }
  })
}
