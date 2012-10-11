var npm = require("npm")
  , npmconf = require("npmconf")
  , assert = require("assert")
  , path = require('path')
  , request = require('request')
  , fs = require('graceful-fs')
  , http = require('http')
  , nopt = require('nopt')
  , log = require("npmlog")

  , configDefs = npmconf.defs
  , shorthands = configDefs.shorthands
  , types = configDefs.types
  , conf = nopt(types, shorthands)
  //We create a server and a proxy (see README).
  , server = http.createServer(function(req, res){
      res.statusCode = 200
      if(req.url == '/proxy') {
        // opens file in read, with a stream
        fs.createReadStream(__dirname+'/proxy.tar.gz').on('error', function(err){
          // something goes wrong while reading
          log.warn(err)
          res.statusCode = 404
          res.end()
        }).pipe(res)
        // read data are piped into the response
      } else {
        fs.createReadStream(__dirname+'/noproxy.tar.gz').on('error', function(err){
          log.warn(err)
          res.statusCode = 404
          res.end()
        }).pipe(res)
      }
    })
  , proxy = http.createServer(function (req, res) {
      res.statusCode = 200
      var url = 'http://localhost:80/proxy'
      var x = request(url)
      req.pipe(x)
      x.pipe(res)
    })

npm.load(conf, function (er, npm) {
  if(er)  log.warn(er)

  //Set proxy configuration, launch server and proxy
  var initialize = function (cb) {
    npm.config.set('proxy', 'http://localhost:8080')
    server.listen(80, 'localhost', function () {
      proxy.listen(8080, 'localhost', cb)
    })
  }

  //Tests
  initialize(function () {
    assert.equal('http://localhost:8080', npm.config.get('proxy'))
    //Checking the route for server and proxy
    request.get("http://localhost:80/test", function (err, res, body) {
      assert.equal(res.statusCode, 200)
      request.get("http://localhost:80/proxy", function (err, res2, body) {
        assert.equal(res2.statusCode, 200)
        request.get("http://localhost:8080/test", function (err, res3, body) {
          assert.equal(res3.statusCode, 200)
          makeNoProxyTest(function () {
            makeProxyTest(function () {
              closeServer(server)
              closeServer(proxy)
            })
          })
        })
      })
    })
  })

  //Use npm with noproxy
  var makeNoProxyTest = function (cb) {
    //Set noproxy configuration
    npm.config.set('noproxy', 'localhost , example.com')
    assert.equal('localhost , example.com', npm.config.get('noproxy'))
    //Install from localhost:80/test without proxy
    npm.commands.install(['http://localhost:80/test'], function () {
      //Let's check if the package directory exists in node_modules
      fs.exists('../test-noproxy-test', function (exists) {
        assert.equal(exists, true)
        cb()
      })
    })
  }

  //Use npm with proxy
  var makeProxyTest = function (cb) {
    //Set proxy configuration
    npm.config.set('noproxy', 'null')
    assert.equal('null', npm.config.get('noproxy'))
    //Install from localhost:80/test with proxy
    npm.commands.install(['http://localhost:80/test'], function () {
      //Let's check if the package directory exists in node_modules
      fs.exists('../test-proxy-test', function (exists) {
        assert.equal(exists, true)
        cb()
      })
    })
  }

  var closeServer = function (s) {
    s.close()
  }

})
