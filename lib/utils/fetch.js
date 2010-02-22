/**
 * Fetch an HTTP url to a local file.
 **/

var http = require("http"),
  url = require("url"),
  sys = require("sys"),
  fs = require("fs"),
  utils = require("./index"),
  Promise = require("events").Promise;

module.exports = function fetch (remote, local, headers, cb) {
  if (!cb) {
    cb = headers;
    headers = {};
  }
  utils.log("Fetch "+remote+" to "+local);
  headers.host = url.parse(remote).hostname;
  fs.open(local, process.O_CREAT | process.O_WRONLY | process.O_TRUNC, 0755,
    function (er, fd) {
      if (er) return cb(er, fd);
      fetchAndWrite(remote, fd, headers, cb);
    }
  );
};

function fetchAndWrite (remote, fd, headers, maxRedirects, redirects, cb) {
  // utils.log("fetchAndWrite "+sys.inspect(Array.prototype.slice.call(arguments, 0)));
  
  if (!cb) {
    cb = redirects;
    redirects = 0;
  }
  if (!cb) {
    cb = maxRedirects;
    maxRedirects = 10;
  }
  if (!cb) throw new Error("No callback provided");
  
  remote = url.parse(remote);
  utils.set(headers, "host", remote.hostname);
  remote.path = remote.pathname+(remote.search||"")+(remote.hash||"");
  http
    .createClient(remote.port || (remote.protocol === "https:" ? 443 : 80), remote.hostname)
    .request("GET", (remote.pathname||"/")+(remote.search||"")+(remote.hash||""), headers)
    .addListener("response", function (response) {
      // handle redirects.
      var loc = utils.get(response.headers, "location");
      if (loc && loc !== remote.href && redirects < maxRedirects) {
        // This is a laughably naïve way to handle this situation.
        // @TODO: Really need a full curl or wget style module that would 
        // do all this kind of stuff for us.
        var cookie = utils.get(response.headers, "Set-Cookie");
        if (cookie) {
          cookie = cookie.split(";").shift();
          utils.set(headers, "Cookie", cookie);
        }
        return fetchAndWrite(loc, fd, headers, maxRedirects, redirects + 1, cb);
      }
      
      // don't set the encoding, because we're just going to write the bytes as-is
      response.addListener("data", function (chunk) {
        // write the chunk...
        fs.write(fd, chunk, function (er) { if (er) cb(er) })
      })
      response.addListener("error", cb);
      response.addListener("end", function () { fs.close(fd, cb) });
    })
    .close();
}
