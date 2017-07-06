"use strict";
const npm = require('./npm.js');
const output = require('./utils/output.js');
const whoami = function(args, silent, cb) {
  // FIXME: need tighter checking on this, but is a breaking change
  if (typeof cb !== 'function') {
    cb = silent;
    silent = false;
  }
  if (!(npm.config.get('registry'))) {
    return cb(new Error('no default registry set'));
  }
  const auth = npm.config.getCredentialsByURI(registry);
  if (auth) {
    if (auth.username) {
      if (!silent) {
        output(auth.username);
      }
      return process.nextTick(cb.bind(this, null, auth.username));
    } else {
      if (auth.token) {
        return npm.registry.whoami(registry, { auth: auth }, function (er, username) {
          if (er) {
            return cb(er);
          }
          if (!username) {
            const needNewSession = new Error('Your auth token is no longer valid. Please log in again.');
            needNewSession.code = 'ENEEDAUTH';
            return cb(needNewSession);
          }
          if (!silent) {
            output(username);
          }
          cb(null, username);
        });
      }
    }
  }

  // At this point, if they have a credentials object, it doesn't have a token
  // or auth in it.  Probably just the default registry.
  const needAuth = new Error('this command requires you to be logged in.');
  needAuth.code = 'ENEEDAUTH';
  process.nextTick(cb.bind(this, needAuth));
}
whoami.usage = 'npm whoami [--registry <registry>]\n(just prints username according to given registry)';
module.exports = whoami;
