module.exports = open

var npm = require("../npm.js")
  , log = require("npmlog")
  , opener = require("opener")

function open (url, cb) {
  var args = [url]
    , browser = npm.config.get("browser")

  if (browser) {
    args.unshift(browser)
  }

  log.info("Go to", url)
  log.http("Opening browser...")

  opener(args, function (err) {
    if (err) {
      log.error("browser", err) 
    }
  })
  cb()
}
