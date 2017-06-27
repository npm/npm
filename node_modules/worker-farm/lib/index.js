const Farm = require('./farm')

var farms = [] // keep record of farms so we can end() them if required

function farm (options, path, methods) {
  if (typeof options == 'string') {
    methods = path
    path = options
    options = {}
  }

  var f   = new Farm(options, path)
    , api = f.setup(methods)

  farms.push({ farm: f, api: api })

  // return the public API
  return api
}

function end (api, callback) {
  for (var i = 0; i < farms.length; i++)
    if (farms[i] && farms[i].api === api)
      return farms[i].farm.end(callback)
  process.nextTick(callback.bind(null, 'Worker farm not found!'))
}

module.exports     = farm
module.exports.end = end