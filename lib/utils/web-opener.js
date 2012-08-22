module.exports = open

var exec = require("./exec.js")
  , npm = require("../npm.js")
  , log = require("npmlog")

function open (url, cb) {
  var browser = npm.config.get("browser")
    , cmd
    , args

  if (!browser) {
    var er = new Error(["the 'browser' config is not set.  Try doing this:"
                       ,"    npm config set browser google-chrome"
                       ,"or:"
                       ,"    npm config set browser lynx"].join("\n"))
    return cb(er)
  }

  if (process.platform === "win32" && browser === "start") {
    cmd = "cmd"
    /*
      Windows command "start" takes the first argument in quotes 
    as a window title, but not as a file or command.
    For example,
      start help.html
    open browser with help.html,

      start "C:\Program files\help.html"
    open empty command prompt with title "C:\Program files\help.html",

      start "" "C:\Program files\help.html"
    open browser with help.html
    */
    args = ["/c", "start", "\"\"", url]
  } else {
    cmd = browser
    args = [url]
  }
  
  log.info("Go to", url)
  log.http("Opening browser...")

  exec(cmd, args, process.env, false, function (err) {
    if (err) {
      log.error("browser", err) 
    }
  })
  cb()
}