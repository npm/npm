/**
 * Fetch an HTTP url to a local file.
 **/

var http = require("/http.js");

exports.fetch = function fetch (remote, local, headers, encoding) {
  var p = new node.Promise();
    
  var uri = http.parseUri(remote);
  headers = headers || {};
  headers.Host = uri.host;
  
  http
    .createClient(uri.port || (uri.protocol === "https" ? 443 : 80), uri.host)
    .get(uri.path || "/", headers)
    .finish(function (response) {
      // try to get the encoding
      response.setBodyEncoding("utf8");
      
      
      response.addListener("body", function (chunk) {
        // write the chunk...
        log("got a chunk of body");
      });
      response.addListener("error", function () {
        log("failure: could not download "+tarball);
        p.emitError();
      });
      response.addListener("complete", function () {
        log("downloaded: "+tarball);
        p.emitSuccess();
      });
    });
    
  
  return p;
};