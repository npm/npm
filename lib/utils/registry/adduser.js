
module.exports = adduser

var uuid = require("../uuid")
  , request = require("./request")
  , log = require("../log")
  , base64 = require("../base64")
  , npm = require("../../../npm")
  , crypto

try {
  crypto = process.binding("crypto") && require("crypto")
} catch (ex) {}

function sha (s) {
  return crypto.createHash("sha1").update(s).digest("hex")
}

function adduser (username, password, email, cb) {
  if (!crypto) return cb(new Error(
    "You must compile node with ssl support to use the adduser feature"))
  var salt = uuid.generate()
    , userobj =
      { name : username
      , salt : salt
      , password_sha : sha(password + salt)
      , email : email
      , _id : 'org.couchdb.user:'+username
      , type : "user"
      , roles : []
      }
  cb = done(cb)
  log.verbose(userobj, "before first PUT")
  request.PUT
    ( '/adduser/org.couchdb.user:'+encodeURIComponent(username)
    , userobj
    , function (error, data, json, response) {
        // if it worked, then we just created a new user, and all is well.
        // but if we're updating a current record, then it'll 409 first
        if (error && !npm.config.get("_auth")) {
          // must be trying to re-auth on a new machine.
          // use this info as auth
          npm.config.set("username", username)
          npm.config.set("_password", password)
          npm.config.set("_auth", base64.encode(username+":"+password))
        }
        if (!error || !response || response.statusCode !== 409) {
          return cb(error, data, json, response)
        }
        log.verbose("update existing user", "adduser")
        return request.GET
          ( '/getuser/org.couchdb.user:'+encodeURIComponent(username)
          , function (er, data, json, response) {
              userobj._rev = data._rev
              userobj.roles = data.roles
              log.verbose(userobj, "userobj")
              request.PUT
                ( '/adduser/org.couchdb.user:'+encodeURIComponent(username)
                  + "/-rev/" + userobj._rev
                , userobj
                , cb
                )
            }
          )
      }
    )
}

function done (cb) { return function (error, data, json, response) {
  if (!error && (!response || response.statusCode === 201)) {
    return cb(error, data, json, response)
  }
  log.verbose(response && response.statusCode, "adduser response")
  log.error(error, "adduser")
  return cb(new Error( (response && response.statusCode) + " "+
    "Could not create user "+error+'\n'+JSON.stringify(data)))
}}
