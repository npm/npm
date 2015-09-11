module.exports = getPathVar;

function getPathVar(platform) {
  var PATH = 'PATH';
  platform = platform || process.platform;

  if (platform === 'win32') {
    PATH = 'Path';
    Object.keys(process.env).some(e => {
      var matches = e.match(/^PATH$/i);
      if (matches) {
        PATH = e;
      }
      return matches;
    });
  }
  return PATH;
}
