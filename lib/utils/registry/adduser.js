
module.exports = adduser

var uuid = require("../uuid")
  , request = require("./request")
  , log = require("../log")
  , crypto

try {
  crypto = process.binding("crypto") && require("crypto")
} catch (ex) {}

function sha (s) {
  return crypto.createHash("sha1").update(s).digest("hex")
}

function adduser (username, password, email, callback) {
  if (!crypto) return cb(new Error(
    "You must compile node with ssl support to use the adduser feature"))
  var salt = uuid.generate()
    , userobj =
      { _id : 'org.couchdb.user:'+username
      , name : username
      , type : "user"
      , roles : []
      , salt : salt
      , password_sha : sha(password + salt)
      , email : email
      }
  request.PUT
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
