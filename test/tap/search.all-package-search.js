var path = require('path')
var mkdirp = require('mkdirp')
var mr = require('npm-registry-mock')
var osenv = require('osenv')
var rimraf = require('rimraf')
var cacheFile = require('npm-cache-filename')
var test = require('tap').test
var Tacks = require('tacks')
var File = Tacks.File

var common = require('../common-tap.js')

var PKG_DIR = path.resolve(__dirname, 'search')
var CACHE_DIR = path.resolve(PKG_DIR, 'cache')
var cacheBase = cacheFile(CACHE_DIR)(common.registry + '/-/all')
var cachePath = path.join(cacheBase, '.cache.json')

var server

test('setup', function (t) {
  mr({port: common.port, throwOnUnmatched: true}, function (err, s) {
    t.ifError(err, 'registry mocked successfully')
    server = s
    t.pass('all set up')
    t.done()
  })
})

var searches = [
  {
    term: 'cool',
    description: 'non-regex search',
    location: 103
  },
  {
    term: '/cool/',
    description: 'regex search',
    location: 103
  },
  {
    term: 'cool',
    description: 'searches name field',
    location: 103
  },
  {
    term: 'ool',
    description: 'excludes matches for --searchexclude',
    location: 205,
    inject: {
      other: { name: 'other', description: 'this is a simple tool' }
    },
    extraOpts: ['--searchexclude', 'cool']
  },
  {
    term: 'neat lib',
    description: 'searches description field',
    location: 141,
    inject: {
      cool: {
        name: 'cool', version: '5.0.0', description: 'this is a neat lib'
      }
    }
  },
  {
    term: 'foo',
    description: 'skips description field with --no-description',
    location: 80,
    inject: {
      cool: {
        name: 'cool', version: '5.0.0', description: 'foo bar!'
      }
    },
    extraOpts: ['--no-description']
  },
  {
    term: 'zkat',
    description: 'searches maintainers by name',
    location: 155,
    inject: {
      cool: {
        name: 'cool',
        version: '5.0.0',
        maintainers: [{
          name: 'zkat'
        }]
      }
    }
  },
  {
    term: '=zkat',
    description: 'searches maintainers unambiguously by =name',
    location: 154,
    inject: {
      bar: { name: 'bar', description: 'zkat thing', version: '1.0.0' },
      cool: {
        name: 'cool',
        version: '5.0.0',
        maintainers: [{
          name: 'zkat'
        }]
      }
    }
  },
  {
    term: 'github.com',
    description: 'searches projects by url',
    location: 205,
    inject: {
      bar: {
        name: 'bar',
        url: 'gitlab.com/bar',
        // For historical reasons, `url` is only present if `versions` is there
        versions: ['1.0.0'],
        version: '1.0.0'
      },
      cool: {
        name: 'cool',
        version: '5.0.0',
        versions: ['1.0.0'],
        url: 'github.com/cool/cool'
      }
    }
  },
  {
    term: 'monad',
    description: 'searches projects by keywords',
    location: 197,
    inject: {
      cool: {
        name: 'cool',
        version: '5.0.0',
        keywords: ['monads']
      }
    }
  }
]

// These test classic hand-matched searches
searches.forEach(function (search) {
  test(search.description, function (t) {
    setup()
    server.get('/-/v1/search?text=' + encodeURIComponent(search.term) + '&size=20').once().reply(404, {})
    var now = Date.now()
    var cacheContents = {
      '_updated': now,
      bar: { name: 'bar', version: '1.0.0' },
      cool: { name: 'cool', version: '5.0.0' },
      foo: { name: 'foo', version: '2.0.0' },
      other: { name: 'other', version: '1.0.0' }
    }
    for (var k in search.inject) {
      cacheContents[k] = search.inject[k]
    }
    var fixture = new Tacks(File(cacheContents))
    fixture.create(cachePath)
    common.npm([
      'search', search.term,
      '--registry', common.registry,
      '--cache', CACHE_DIR,
      '--loglevel', 'error',
      '--color', 'always'
    ].concat(search.extraOpts || []),
    {},
    function (err, code, stdout, stderr) {
      t.equal(stderr, '', 'no error output')
      t.notEqual(stdout, '', 'got output')
      t.equal(code, 0, 'search finished successfully')
      t.ifErr(err, 'search finished successfully')
      // \033 == \u001B
      var markStart = '\u001B\\[[0-9][0-9]m'
      var markEnd = '\u001B\\[0m'

      var re = new RegExp(markStart + '.*?' + markEnd)

      var cnt = stdout.search(re)
      t.equal(
        cnt,
        search.location,
        search.description + ' search for ' + search.term
      )
      t.end()
    })
  })
})

test('cleanup', function (t) {
  cleanup()
  server.close()
  t.end()
})

function setup () {
  cleanup()
  mkdirp.sync(cacheBase)
}

function cleanup () {
  server.done()
  process.chdir(osenv.tmpdir())
  rimraf.sync(PKG_DIR)
}
