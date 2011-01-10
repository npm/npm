#!/usr/bin/env/ node

// Run a command as nobody
// env is passed through untouched.
// usage: npm-script-runner $folder $uid "make test"
// This is internal plumbing

console.error(process.argv)

var argv = process.argv.slice(2)
  , cwd = argv.shift()
  , cmd = argv.shift()
  , uid = argv.shift()
  , stdio = process.binding("stdio")

try {
  process.setuid(uid)
} catch (ex) {
  console.error("Could not setuid to "+uid)
  throw ex
}


require("child_process").spawn( "sh", ["-c", cmd]
                              , { env : process.env
                                , cwd : cwd
                                , customFDs: [ stdio.stdinFD
                                             , stdio.stdoutFD
                                             , stdio.stderrFD ]
                                })
                        .on("exit", function (c) { process.exit(c) })
