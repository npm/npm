module.exports = doWhile

// usage:
//
// doWhile(function (next) {
//   if (keepGoing) {
//     return next(true)  //passing true will call this anonymous function again
//   }
//   else {
//     return next(false) //passing false will call the second parameter to doWhile (the done function)
//                        //or you could just call your callback here
//   }
// }
// , function () {
//   return cb()
// })
//

function doWhile (fn, done) {
  run(fn)
  
  function run (fn) {
    process.nextTick(function() {
      fn(function (cont) {
        if (cont) {
          run(fn)
        }
        else if (done) {
          done()
        }
      })
    })
  }
}