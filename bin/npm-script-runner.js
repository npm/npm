#!/usr/bin/env node

// Run a command as a specific user.
// env is passed through untouched.
// usage: npm-script-runner $folder $uid $gid "make test"
// This is internal plumbing

var argv = process.argv.slice(2)
  , cwd = argv.shift()
  , uid = argv.shift()
  , gid = argv.shift()
  , cmd = argv.shift()
  , stdio = process.binding("stdio")
  , cp = require("child_process")

process.setgid(gid)
process.setuid(uid)

cp.spawn( "sh", ["-c", cmd]
        , { env : process.env
          , cwd : cwd
          , customFds: [ stdio.stdinFD
                       , stdio.stdoutFD
                       , stdio.stderrFD ]
          } )
  .on("exit", function (c) { process.exit(c) })
