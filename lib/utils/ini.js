var fs = require('fs'),
    path = require('path'),
    http = require('http');

var default_config  = {'auto-activate':true, root:path.join(process.env.HOME, 'node-libraries')}

function getConfig (callback) {
  var configfile = path.join(process.env.HOME, '.npmrc')
  try {
    var stats = fs.statSync(configfile);
  } catch(e) {
    var stats = null;
  }
  
  if (stats) {
    var config = JSON.parse(fs.readFileSync(configfile, "utf8")); 
  } else {
    var config = default_config;
    fs.writeFileSync(configfile, JSON.stringify(config), "utf8");
  }
  config.save = function () {fs.writeFileSync(configfile, JSON.stringify(config), "utf8");}
  config.set = function(key, value) {config[key] = value; return value;}
  return config
}

// Protect against having two config objects inside the same node process.
config = getConfig();
exports.getConfig = function () {return config;}