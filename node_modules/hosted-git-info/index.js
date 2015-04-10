'use strict'
var url = require('url')

var GitHost = exports = module.exports = function (type, user, project, comittish, defaultType) {
  var gitHostInfo = this
  gitHostInfo.type = type
  Object.keys(gitHosts[type]).forEach(function (key) {
    gitHostInfo[key] = gitHosts[type][key]
  })
  gitHostInfo.user = user
  gitHostInfo.project = project
  gitHostInfo.comittish = comittish
  gitHostInfo.default = defaultType
}
GitHost.prototype = {}

var protocolMap = {
  'git+ssh': 'sshurl',
  'git+https': 'https',
  'ssh': 'sshurl',
  'git': 'git'
}

function protocolToType (protocol) {
  if (protocol.substr(-1) === ':') protocol = protocol.slice(0, -1)
  return protocolMap[protocol] || protocol
}

exports.fromUrl = function (giturl) {
  if (giturl == null || giturl === '') return
  var parsed = parseGitUrl(maybeGitHubShorthand(giturl) ? 'github:' + giturl : giturl)
  var matches = Object.keys(gitHosts).map(function (V) {
    var gitHost = gitHosts[V]
    var comittish = parsed.hash ? decodeURIComponent(parsed.hash.substr(1)) : null
    if (parsed.protocol === V + ':') {
      return new GitHost(V,
        decodeURIComponent(parsed.host), decodeURIComponent(parsed.path.replace(/^[/](.*?)(?:[.]git)?$/, '$1')), comittish, 'shortcut')
    }
    if (parsed.host !== gitHost.domain) return
    if (!gitHost.protocols_re.test(parsed.protocol)) return
    var pathmatch = gitHost.pathmatch || gitHostDefaults.pathmatch
    var matched = parsed.path.match(pathmatch)
    if (!matched) return
    return new GitHost(
      V,
      matched[1] != null && decodeURIComponent(matched[1]),
      matched[2] != null && decodeURIComponent(matched[2]),
      comittish,
      protocolToType(parsed.protocol))
  }).filter(function (V) { return V })
  if (matches.length !== 1) return
  return matches[0]
}

function maybeGitHubShorthand (arg) {
  // Note: This does not fully test the git ref format.
  // See https://www.kernel.org/pub/software/scm/git/docs/git-check-ref-format.html
  //
  // The only way to do this properly would be to shell out to
  // git-check-ref-format, and as this is a fast sync function,
  // we don't want to do that.  Just let git fail if it turns
  // out that the commit-ish is invalid.
  // GH usernames cannot start with . or -
  return /^[^:@%/\s.-][^:@%/\s]*[/][^:@\s/%]+(?:#.*)?$/.test(arg)
}

var parseGitUrl = function (giturl) {
  if (typeof giturl !== 'string') giturl = '' + giturl
  var matched = giturl.match(/^([^@]+)@([^:]+):[/]?((?:[^/]+[/])?[^/]+?)(?:[.]git)?(#.*)?$/)
  if (!matched) return url.parse(giturl)
  return {
    protocol: 'git+ssh:',
    slashes: true,
    auth: matched[1],
    host: matched[2],
    port: null,
    hostname: matched[2],
    hash: matched[4],
    search: null,
    query: null,
    pathname: '/' + matched[3],
    path: '/' + matched[3],
    href: 'git+ssh://' + matched[1] + '@' + matched[2] + '/' + matched[3] + (matched[4] || '')
  }
}

var gitHostDefaults = {
  'sshtemplate': 'git@{domain}:{user}/{project}.git{#comittish}',
  'sshurltemplate': 'git+ssh://git@{domain}/{user}/{project}.git{#comittish}',
  'browsetemplate': 'https://{domain}/{user}/{project}{/tree/comittish}',
  'docstemplate': 'https://{domain}/{user}/{project}{/tree/comittish}#readme',
  'httpstemplate': 'git+https://{domain}/{user}/{project}.git{#comittish}',
  'filetemplate': 'https://{domain}/{user}/{project}/raw/{comittish}/{path}',
  'shortcuttemplate': '{type}:{user}/{project}{#comittish}',
  'pathtemplate': '{user}/{project}{#comittish}',
  'pathmatch': /^[/]([^/]+)[/]([^/]+?)(?:[.]git)?$/
}
var gitHosts = {
  github: {
    // First two are insecure and generally shouldn't be used any more, but
    // they are still supported.
    'protocols': [ 'git', 'http', 'git+ssh', 'git+https', 'ssh', 'https' ],
    'domain': 'github.com',
    'treepath': 'tree',
    'filetemplate': 'https://raw.githubusercontent.com/{user}/{project}/{comittish}/{path}',
    'bugstemplate': 'https://{domain}/{user}/{project}/issues',
    'gittemplate': 'git://{domain}/{user}/{project}.git{#comittish}'
  },
  bitbucket: {
    'protocols': [ 'git+ssh', 'git+https', 'ssh', 'https' ],
    'domain': 'bitbucket.org',
    'treepath': 'src'
  },
  gitlab: {
    'protocols': [ 'git+ssh', 'git+https', 'ssh', 'https' ],
    'domain': 'gitlab.com',
    'treepath': 'tree',
    'docstemplate': 'https://{domain}/{user}/{project}{/tree/comittish}#README',
    'bugstemplate': 'https://{domain}/{user}/{project}/issues'
  },
  gist: {
    'protocols': [ 'git', 'git+ssh', 'git+https', 'ssh', 'https' ],
    'domain': 'gist.github.com',
    'pathmatch': /^[/](?:([^/]+)[/])?([a-z0-9]+)(?:[.]git)?$/,
    'filetemplate': 'https://gist.githubusercontent.com/{user}/{project}/raw{/comittish}/{path}',
    'bugstemplate': 'https://{domain}/{project}',
    'gittemplate': 'git://{domain}/{project}.git{#comittish}',
    'sshtemplate': 'git@{domain}:/{project}.git{#comittish}',
    'sshurltemplate': 'git+ssh://git@{domain}/{project}.git{#comittish}',
    'browsetemplate': 'https://{domain}/{project}{/comittish}',
    'docstemplate': 'https://{domain}/{project}{/comittish}',
    'httpstemplate': 'git+https://{domain}/{project}.git{#comittish}',
    'shortcuttemplate': '{type}:{project}{#comittish}',
    'pathtemplate': '{project}{#comittish}'
  }
}

Object.keys(gitHosts).forEach(function (host) {
  gitHosts[host].protocols_re = RegExp('^(' +
    gitHosts[host].protocols.map(function (P) {
      return P.replace(/([\\+*{}()\[\]$^|])/g, '\\$1')
    }).join('|') + '):$')
})

GitHost.prototype.hash = function () {
  return this.comittish ? '#' + this.comittish : ''
}

GitHost.prototype._fill = function (template, vars) {
  if (!template) return
  if (!vars) vars = {}
  var self = this
  Object.keys(this).forEach(function (K) { if (self[K] != null && vars[K] == null) vars[K] = self[K] })
  var rawComittish = vars.comittish
  Object.keys(vars).forEach(function (K) { (K[0] !== '#') && (vars[K] = encodeURIComponent(vars[K])) })
  vars['#comittish'] = rawComittish ? '#' + rawComittish : ''
  vars['/tree/comittish'] = vars.comittish ? '/' + vars.treepath + '/' + vars.comittish : ''
  vars['/comittish'] = vars.comittish ? '/' + vars.comittish : ''
  vars.comittish = vars.comittish || 'master'
  var res = template
  Object.keys(vars).forEach(function (K) {
    res = res.replace(new RegExp('[{]' + K + '[}]', 'g'), vars[K])
  })
  return res
}

GitHost.prototype.ssh = function () {
  var sshtemplate = this.sshtemplate || gitHostDefaults.sshtemplate
  return this._fill(sshtemplate)
}

GitHost.prototype.sshurl = function () {
  var sshurltemplate = this.sshurltemplate || gitHostDefaults.sshurltemplate
  return this._fill(sshurltemplate)
}

GitHost.prototype.browse = function () {
  var browsetemplate = this.browsetemplate || gitHostDefaults.browsetemplate
  return this._fill(browsetemplate)
}

GitHost.prototype.docs = function () {
  var docstemplate = this.docstemplate || gitHostDefaults.docstemplate
  return this._fill(docstemplate)
}

GitHost.prototype.bugs = function () {
  var bugstemplate = this.bugstemplate || gitHostDefaults.bugstemplate
  return this._fill(bugstemplate)
}

GitHost.prototype.https = function () {
  var httpstemplate = this.httpstemplate || gitHostDefaults.httpstemplate
  return this._fill(httpstemplate)
}

GitHost.prototype.git = function () {
  var gittemplate = this.gittemplate || gitHostDefaults.gittemplate
  return this._fill(gittemplate)
}

GitHost.prototype.shortcut = function () {
  var shortcuttemplate = this.shortcuttemplate || gitHostDefaults.shortcuttemplate
  return this._fill(shortcuttemplate)
}

GitHost.prototype.path = function () {
  var pathtemplate = this.pathtemplate || gitHostDefaults.pathtemplate
  return this._fill(pathtemplate)
}

GitHost.prototype.file = function (P) {
  var filetemplate = this.filetemplate || gitHostDefaults.filetemplate
  return this._fill(filetemplate, {
    path: P.replace(/^[/]+/g, '')
  })
}

GitHost.prototype.getDefaultRepresentation = function () {
  return this.default
}

GitHost.prototype.toString = function () {
  return (this[this.default] || this.sshurl).call(this)
}
