// short names for common things
var aliases = {
  'rm': 'uninstall',
  'r': 'uninstall',
  'un': 'uninstall',
  'unlink': 'uninstall',
  'remove': 'uninstall',
  'rb': 'rebuild',
  'list': 'ls',
  'la': 'ls',
  'll': 'ls',
  'ln': 'link',
  'i': 'install',
  'isntall': 'install',
  'it': 'install-test',
  'up': 'update',
  'upgrade': 'update',
  'c': 'config',
  'dist-tags': 'dist-tag',
  'info': 'view',
  'show': 'view',
  'find': 'search',
  's': 'search',
  'se': 'search',
  'author': 'owner',
  'home': 'docs',
  'issues': 'bugs',
  'unstar': 'star', // same function
  'apihelp': 'help',
  'login': 'adduser',
  'add-user': 'adduser',
  'tst': 'test',
  't': 'test',
  'find-dupes': 'dedupe',
  'ddp': 'dedupe',
  'v': 'view',
  'verison': 'version'
}

// these are filenames in .
var cmdList = [
  'install',
  'install-test',
  'uninstall',
  'cache',
  'config',
  'set',
  'get',
  'update',
  'outdated',
  'prune',
  'pack',
  'dedupe',

  'rebuild',
  'link',

  'publish',
  'star',
  'stars',
  'tag',
  'adduser',
  'logout',
  'unpublish',
  'owner',
  'access',
  'team',
  'deprecate',
  'shrinkwrap',

  'help',
  'help-search',
  'ls',
  'search',
  'view',
  'init',
  'version',
  'edit',
  'explore',
  'docs',
  'repo',
  'bugs',
  'faq',
  'root',
  'prefix',
  'bin',
  'whoami',
  'dist-tag',
  'ping',

  'test',
  'stop',
  'start',
  'restart',
  'run-script',
  'completion'
]

var plumbing = [
  'build',
  'unbuild',
  'xmas',
  'substack',
  'visnup'
]

module.exports.aliases = aliases
module.exports.cmdList = cmdList
module.exports.plumbing = plumbing
