
module.exports = adduser

var uuid = require("../uuid")
  , crypto = require("crypto")
  , request = require("./request")
  , log = require("../log")

function sha (s) {
  return new crypto.Hash().init("sha1").update(s).digest("hex")
}

function adduser (username, password, email, callback) {
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
