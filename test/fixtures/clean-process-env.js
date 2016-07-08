// `npm run tap` dumps a ton of npm_config_* variables in the environment.
Object.keys(process.env)
  .filter(function (key) {
    return /^npm_config_/.test(key)
  })
  .forEach(function (key) {
    delete process.env[key]
  })
