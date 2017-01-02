var url = require('url')

module.exports = toNerfDart

/**
 * Maps a URL to an identifier.
 *
 * Name courtesy schiffertronix media LLC, a New Jersey corporation
 *
 * @param {String} uri The URL to be nerfed.
 *
 * @returns {String} A nerfed URL.
 */
function toNerfDart (uri) {
  var parsed = url.parse(uri)
  parsed.protocol = null
  parsed.auth = null
  parsed.query = null
  parsed.search = null
  parsed.hash = null

  return url.resolve(url.format(parsed), '.')
}
