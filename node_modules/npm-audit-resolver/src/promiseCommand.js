const spawnShell = require('spawn-shell');
const concat = require('concat-stream');


module.exports = function promiseCommand (command, opts={}) {
  console.log('>>>>', command)
  const pSpawn = spawnShell(command, Object.assign({
    stdio: [0, 'pipe', 2],
    env: process.env
  }, opts))

  const pOutput = new Promise((resolve, reject) => {
    pSpawn.stdout.pipe(concat(
      {encoding: 'string'},
      output => {
        resolve(output)
      }
    )
  ).on('error', reject)
  })

  return Promise.all([
    pSpawn.exitPromise
        .then((exitCode) => {
          if (opts.ignoreExit || exitCode === 0) {
            console.log('>>>> exit:', exitCode)
            return
          } else {
            throw Error('Exit ' + exitCode)
          }
        }),
    pOutput]).then(arr => arr[1])
}
