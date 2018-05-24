'use strict'
const fs = require('fs')

var NYC
try {
  NYC = require('../../index.covered.js')
} catch (e) {
  NYC = require('../../index.js')
}

exports.command = 'merge <input-directory> [output-file]'

exports.describe = 'merge istanbul format coverage output in a given folder'

exports.builder = function (yargs) {
  return yargs
    .positional('input-directory', {
      describe: 'directory containing multiple istanbul coverage files',
      type: 'text',
      default: './.nyc_output'
    })
    .positional('output-file', {
      describe: 'file to output combined istanbul format coverage to',
      type: 'text',
      default: 'coverage.json'
    })
    .option('temp-directory', {
      describe: 'directory to read raw coverage information from',
      default: './.nyc_output'
    })
    .example('$0 merge ./out coverage.json', 'merge together reports in ./out and output as coverage.json')
}

exports.handler = function (argv) {
  process.env.NYC_CWD = process.cwd()
  const nyc = new NYC(argv)
  let inputStat
  try {
    inputStat = fs.statSync(argv.inputDirectory)
    if (!inputStat.isDirectory()) {
      console.error(`${argv.inputDirectory} was not a directory`)
      process.exit(1)
    }
  } catch (err) {
    console.error(`failed access input directory ${argv.inputDirectory} with error:\n\n${err.message}`)
    process.exit(1)
  }
  const map = nyc.getCoverageMapFromAllCoverageFiles(argv.inputDirectory)
  fs.writeFileSync(argv.outputFile, JSON.stringify(map, null, 2), 'utf8')
  console.info(`coverage files in ${argv.inputDirectory} merged into ${argv.outputFile}`)
}
