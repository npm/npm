var url = require("url")

module.exports = toNerfDart

/**
 * Maps a URL to an identifier.
 *
 * Adapted under the ISC License from `npm` and `npm-registry-client`
 *   - https://github.com/npm/npm-registry-client/blob/master/lib/util/nerf-dart.js
 *   - https://github.com/npm/npm/blob/master/lib/config/nerf-dart.js
 *
 * Name courtesy schiffertronix media LLC, a New Jersey corporation
 *
 * @param {String} uri The URL to be nerfed.
 *
 * @returns {String} A nerfed URL.
 */
function toNerfDart(uri) {
  var parsed = url.parse(uri)
  parsed.pathname = "/"
  delete parsed.protocol
  delete parsed.auth
  delete parsed.query
  delete parsed.search
  delete parsed.hash

  return url.format(parsed)
}