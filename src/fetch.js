/**
 * Fetch an HTTP url to a local file.
 **/

var http = require("/http.js");

include("./utils.js");

exports.fetch = function fetch (remote, local, headers) {
  var p = new node.Promise();
  
  var uri = http.parseUri(remote);
  headers = headers || {};
  headers.Host = uri.host;
  
  node.fs.open(
    local,
    node.O_CREAT | node.O_WRONLY | node.O_TRUNC | node.O_APPEND | node.O_SYMLINK,
    0755
  ).addErrback(function () {
    p.emitError("could not open "+local+" for writing.");
  }).addCallback(function (fd) {
    fetchAndWrite(remote, fd, p, headers);
  });
  
  return p;
};

function fetchAndWrite (remote, fd, p, headers, maxRedirects, redirects) {
  redirects = redirects || 0;
  maxRedirects = maxRedirects || 10;
  var uri = http.parseUri(remote);
  log(remote, "fetch");
  set(headers, "Host", uri.host);
  
  http
    .createClient(uri.port || (uri.protocol === "https" ? 443 : 80), uri.host)
    .get(uri.path || "/", headers)
    .finish(function (response) {
      // handle redirects.
      var loc = get(response.headers, "location");
      if (loc && loc !== remote && redirects < maxRedirects) {
        // This is a laughably naïve way to handle this situation.
        // @TODO: Really need a full curl or wget style module that would 
        // do all this kind of stuff for us.
        var cookie = get(response.headers, "Set-Cookie");
        if (cookie) {
          cookie = cookie.split(";").shift();
          set(headers, "Cookie", cookie);
        }
        return fetchAndWrite(loc, fd, p, headers, maxRedirects, redirects + 1);
      }
      
      // don't set the encoding, because we're just going to write the bytes as-is
      response.addListener("body", function (chunk) {
        // write the chunk...
        node.fs.write(fd, chunk)
          .addErrback(function () {
            p.emitError("write error");
          });
      });
      response.addListener("error", bind(p, p.emitError));
      response.addListener("complete", bind(p, p.emitSuccess));
    });
}
