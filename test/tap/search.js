var common = require("../common-tap.js")
var test = require("tap").test
var mr = require("npm-registry-mock")

var EXEC_OPTS = {}

function mocks(server) {
  server.filteringPathRegEx(/startkey=[^&]*/g, "startkey=123")
  server.get("/-/all")
    .reply(200, {})
  server.get("/-/all/since?stale=update_after&startkey=123")
    .reply(200, allSinceMock)
}

var searches = [
  {
    term: "f36b6a6123da50959741e2ce4d634f96ec668c56",
    description: "non-regex",
    location: 241
  },
  {
    term: "/f36b6a6123da50959741e2ce4d634f96ec668c56/",
    description: "regex",
    location: 241
  }
]
searches.forEach(function(search) {
  test(search.description + " search in color", function(t) {
    mr({ port: common.port, mocks: mocks }, function (s) {
      common.npm([
        "search",
        search.term,
        "--registry",
        common.registry,
	"--loglevel",
	"silent",
        "--color", "always"
      ],
      EXEC_OPTS,
      function(err, code, stdout) {
        s.close()
        t.equal(code, 0, "search finished successfully")
        t.ifErr(err, "search finished successfully")
	// \033 == \u001B
        var markStart = "\u001B\\[[0-9][0-9]m"
        var markEnd = "\u001B\\[0m"

        var re = new RegExp(markStart + ".*?" + markEnd)

        var cnt = stdout.search(re)
        t.equal(cnt, search.location, search.description + " search for " + search.term)
        t.end()
      })
    })
  })
})

var allSinceMock = {
  "_updated": 1412309425420,
  "generator-frontcow": {
      "name": "generator-frontcow",
      "description": "f36b6a6123da50959741e2ce4d634f96ec668c56 This is a fake description to ensure we do not accidentally search the real npm registry or use some kind of cache",
      "dist-tags": {
          "latest": "0.1.19"
      },
      "maintainers": [
          {
              "name": "bcabanes",
              "email": "contact@benjamincabanes.com"
          }
      ],
      "homepage": "https://github.com/bcabanes/generator-frontcow",
      "keywords": [
          "sass",
          "frontend",
          "yeoman-generator",
          "atomic",
          "design",
          "sass",
          "foundation",
          "foundation5",
          "atomic design",
          "bourbon",
          "polyfill",
          "font awesome"
      ],
      "repository": {
          "type": "git",
          "url": "https://github.com/bcabanes/generator-frontcow"
      },
      "author": {
          "name": "ben",
          "email": "contact@benjamincabanes.com",
          "url": "https://github.com/bcabanes"
      },
      "bugs": {
          "url": "https://github.com/bcabanes/generator-frontcow/issues"
      },
      "license": "MIT",
      "readmeFilename": "README.md",
      "time": {
          "modified": "2014-10-03T02:26:18.406Z"
      },
      "versions": {
          "0.1.19": "latest"
      }
  },
  "marko": {
      "name": "marko",
      "description": "Marko is an extensible, streaming, asynchronous, high performance, HTML-based templating language that can be used in Node.js or in the browser.",
      "dist-tags": {
          "latest": "1.2.16"
      },
      "maintainers": [
          {
              "name": "pnidem",
              "email": "pnidem@gmail.com"
          },
          {
              "name": "philidem",
              "email": "phillip.idem@gmail.com"
          }
      ],
      "homepage": "https://github.com/raptorjs/marko",
      "keywords": [
          "templating",
          "template",
          "async",
          "streaming"
      ],
      "repository": {
          "type": "git",
          "url": "https://github.com/raptorjs/marko.git"
      },
      "author": {
          "name": "Patrick Steele-Idem",
          "email": "pnidem@gmail.com"
      },
      "bugs": {
          "url": "https://github.com/raptorjs/marko/issues"
      },
      "license": "Apache License v2.0",
      "readmeFilename": "README.md",
      "users": {
          "pnidem": true
      },
      "time": {
          "modified": "2014-10-03T02:27:31.775Z"
      },
      "versions": {
          "1.2.16": "latest"
      }
  }
}
