#!/usr/bin/env node

var Parser = require('../')
var etoa = require('events-to-array')
var util = require('util')

var args = process.argv.slice(2)
var json = null
var bail = false
var preserveWhitespace = true
var omitVersion = false

function version () {
  console.log(require('../package.json').version)
  process.exit(0)
}

args.forEach(function (arg, i) {
  if (arg === '-j') {
    json = args[i + 1] || 2
  } else {
    var m = arg.match(/^--json(?:=([0-9]+))$/)
    if (m)
      json = +m[1] || args[i + 1] || 2
  }

  if (arg === '-v' || arg === '--version')
    version()
  else if (arg === '-o' || arg === '--omit-version')
    omitVersion = true
  else if (arg === '-w' || arg === '--ignore-all-whitespace')
    preserveWhitespace = false
  else if (arg === '-b' || arg === '--bail')
    bail = true
  else if (arg === '-t' || arg === '--tap')
    json = 'tap'
  else if (arg === '-l' || arg === '--lines')
    json = 'lines'
  else if (arg === '-h' || arg === '--help')
    usage()
  else
    console.error('Unrecognized arg: %j', arg)

  if (arg === '-v' || arg === '--version')
    console.log(require('../package.json').version)
})

function usage () {
  console.log(function () {/*
Usage:
  tap-parser <options>

Parses TAP data from stdin, and outputs the parsed result
in the format specified by the options.  Default output is
uses node's `util.format()` method.

Options:

  -j [<indent>] | --json[=indent]
    Output event data as JSON with the specified indentation (default=2)

  -t | --tap
    Output data as reconstituted TAP based on parsed results

  -l | --lines
    Output each parsed line as it is recognized by the parser

  -b | --bail
    Emit a `Bail out!` at the first failed test point encountered

  -w | --ignore-all-whitespace
    Skip over blank lines outside of YAML blocks

  -o | --omit-version
    Ignore the `TAP version 13` line at the start of tests
*/}.toString().split('\n').slice(1, -1).join('\n'))

  if (!process.stdin.isTTY)
    process.stdin.resume()

  process.exit()
}

var yaml = require('js-yaml')
function tapFormat (msg, indent) {
  return indent + msg.map(function (item) {
    switch (item[0]) {
      case 'child':
        var comment = item[1][0]
        var child = item[1].slice(1)
        return tapFormat([comment], '') + tapFormat(child, '    ')

      case 'version':
        return 'TAP version ' + item[1] + '\n'

      case 'plan':
        var p = item[1].start + '..' + item[1].end
        if (item[1].comment)
          p += ' # ' + item[1].comment
        return p + '\n'

      case 'pragma':
        return 'pragma ' + (item[2] ? '+' : '-') + item[1] + '\n'

      case 'bailout':
        var r = item[1] === true ? '' : (' ' + item[1])
        return 'Bail out!' + r + '\n'

      case 'assert':
        var res = item[1]
        return (res.ok ? '' : 'not ') + 'ok ' + res.id +
          (res.name ? ' - ' + res.name.replace(/ \{$/, '') : '') +
          (res.skip ? ' # SKIP' +
            (res.skip === true ? '' : ' ' + res.skip) : '') +
          (res.todo ? ' # TODO' +
            (res.todo === true ? '' : ' ' + res.todo) : '') +
          (res.time ? ' # time=' + res.time + 'ms' : '') +
          '\n' +
          (res.diag ?
             '  ---\n  ' +
             yaml.safeDump(res.diag).split('\n').join('\n  ').trim() +
             '\n  ...\n'
             : '')

      case 'extra':
      case 'comment':
        return item[1]
    }
  }).join('').split('\n').join('\n' + indent).trim() + '\n'
}

function format (msg) {
  if (json === 'tap')
    return tapFormat(msg, '')
  else if (json !== null)
    return JSON.stringify(msg, null, +json)
  else
    return util.inspect(events, null, Infinity)
}

var options = {
  bail: bail,
  preserveWhitespace: preserveWhitespace,
  omitVersion: omitVersion
}

var parser = new Parser(options)
var events = etoa(parser, [ 'pipe', 'unpipe', 'prefinish', 'finish', 'line' ])

process.stdin.pipe(parser)
if (json === 'lines')
  parser.on('line', function (l) {
    process.stdout.write(l)
  })
else
  process.on('exit', function () {
    console.log(format(events))
    if (!parser.ok)
      process.exit(1)
  })
