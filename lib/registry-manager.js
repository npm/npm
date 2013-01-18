
// Registry manager - makes npm.registry's functions allow a retry

module.exports = RegManager


function RegManager(registries) {
  if (!registries || registries.length<1){
    throw new Error("No registries have been supplied to the registry manager")
  }

  var idx = 0,
  primaryRegistry = registries[0],
  i;

  for (var key in primaryRegistry){
    // No .hasOwnProperty check - we want the prototype chain!
    this[key] = primaryRegistry[key];
  }
  this.get = function(){
    // First attempt at overriding get function - long term this
    // may not be enough. Maybe, the whole NPM install|search|whatever
    // command needs to be retried from scratch if it's falling back to
    // another registry..
    var args = arguments,
    i, _cb
    // Pluck out the callback from the arguments & intercept it
    for (i=0; i<arguments.length; i++){
      if (typeof arguments[i] == 'function'){
        _cb = arguments[i]
        arguments[i] = function(err, data){
          // If the error is 'just' a 404, and there are registries still left to try, let's try them
          if (err && err.code && err.code === "E404" && ++idx<registries.length){
            return registries[idx].get.apply(registries[idx], args);
          }else{
            // Either we've succeeded, we're out of registries, or it's an error we can't deal with
            return _cb(err, data)
          }
        }
      }
    }
    registries[idx].get.apply(this, arguments)
  }
}