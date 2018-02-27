'use strict'
const Bluebird = require('bluebird')
const glob = Bluebird.promisify(require('glob'))
const readFile = Bluebird.promisify(require('fs').readFile)
const writeFile = Bluebird.promisify(require('fs').writeFile)
const packageId = require('../../utils/package-id.js')
const path = require('path')

function parseReq (name) {
  const matched = name.match(/^([.]|(?:[@][^/]+[/])?[^@/]+)(?:[/]([^@]+))?$/)
  return {
    name: matched[1],
    pathinfo: matched[2]
  }
}

module.exports = function (staging, pkg, log) {
  log.silly('rewrite-asset-js', packageId(pkg))
  return glob(`${pkg.path}/**/*.js`).map((file) => {
    return readFile(file, 'utf8').then((content) => {
      content = content.replace(/(import.*from.*['"])([A-Za-z@.][.]?[-A-Za-z0-9_/]+[^"']*)/g, (match, prelude, spec) => {
        const thisModule = parseReq(spec)
        let modpath = thisModule.name[0] === '.'
                    ? path.relative(path.dirname(file), path.resolve(path.dirname(file), thisModule.name))
                    : path.relative(path.dirname(file), path.resolve(`assets/${thisModule.name}`))
        if (thisModule.pathinfo) {
          modpath += (modpath ? '/' : './') + thisModule.pathinfo.trim()
          // not included, loading dirs and having it find `index.js`
          // loading a filename w/o an extension
        }
        if (!/[.]\w+$/.test(modpath)) modpath += '.js'
        return prelude + modpath
      })
      return writeFile(file, content)
    })
  })
}
