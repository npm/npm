'use strict'

module.exports = exports = search

var npm = require('./npm.js')
var allPackageSearch = require('./search/all-package-search')
var esearch = require('./search/esearch.js')
var formatPackageStream = require('./search/format-package-stream.js')
var usage = require('./utils/usage')
var output = require('./utils/output.js')
var log = require('npmlog')
var ms = require('mississippi')

search.usage = usage(
  'search',
  'npm search [--long] [search terms ...]'
)

search.completion = function (opts, cb) {
  cb(null, [])
}

function search (args, cb) {
  var jsonFormat = npm.config.get('json')
  var mute = npm.config.get('mute')
  var parseable = npm.config.get('parseable')
  var searchOpts = {
    description: npm.config.get('description'),
    exclude: prepareExcludes(npm.config.get('searchexclude')),
    full: npm.config.get('full'),
    include: prepareIncludes(args, npm.config.get('searchopts')),
    limit: npm.config.get('searchlimit'),
    log: log,
    staleness: npm.config.get('searchstaleness'),
    unicode: npm.config.get('unicode')
  }

  if (searchOpts.include.length === 0) {
    return cb(new Error('search must be called with arguments'))
  }

  // Used later to figure out whether we had any packages go out
  var anyOutput = ''

  var entriesStream = ms.through.obj()

  var esearchWritten = false
  esearch(searchOpts).on('data', function (pkg) {
    entriesStream.write(pkg)
    !esearchWritten && (esearchWritten = true)
  }).on('error', function (e) {
    if (esearchWritten) {
      // If esearch errored after already starting output, we can't fall back.
      return entriesStream.emit('error', e)
    }
    log.warn('search', 'fast search endpoint errored. Using old search.')
    allPackageSearch(searchOpts).on('data', function (pkg) {
      entriesStream.write(pkg)
    }).on('error', function (e) {
      entriesStream.emit('error', e)
    }).on('end', function () {
      entriesStream.end()
    })
  }).on('end', function () {
    entriesStream.end()
  })

  // Grab a configured output stream that will spit out packages in the
  // desired format.
  var outputStream = formatPackageStream({
    args: args, // --searchinclude options are not highlighted
    long: npm.config.get('long'),
    description: npm.config.get('description'),
    json: jsonFormat,
    parseable: parseable,
    color: npm.color
  })
  outputStream.on('data', function (chunk) {
    var part = chunk.toString('utf8')
    anyOutput += part + '\n'
    if (!mute) { output(part) }
  })

  log.silly('search', 'searching packages')
  ms.pipe(entriesStream, outputStream, function (er) {
    if (er) return cb(er)
    if (!anyOutput && !jsonFormat && !parseable && !mute) {
      output('No matches found for ' + (args.map(JSON.stringify).join(' ')))
    }
    log.silly('search', 'search completed')
    log.clearProgress()
    cb(null,
      jsonFormat
        ? (anyOutput ? JSON.parse(anyOutput) : [])
        : anyOutput)
  })
}

function prepareIncludes (args, searchopts) {
  if (typeof searchopts !== 'string') searchopts = ''
  return searchopts.split(/\s+/).concat(args).map(function (s) {
    return s.toLowerCase()
  }).filter(function (s) { return s })
}

function prepareExcludes (searchexclude) {
  var exclude
  if (typeof searchexclude === 'string') {
    exclude = searchexclude.split(/\s+/)
  } else {
    exclude = []
  }
  return exclude.map(function (s) {
    return s.toLowerCase()
  })
}
