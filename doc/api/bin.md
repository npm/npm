npm-bin(3) -- Display npm bin folder
====================================

## SYNOPSIS

    npm.commands.bin(args, cb)

## DESCRIPTION

Print the folder where npm will install executables.

This function should not be used programmatically.  The logic for
attaining the bin folder is quite simple.

    var bin
    if (npm.config.get("global")) {
      bin = path.resolve(npm.prefix, "bin")
    } else {
      bin = path.resolve(npm.dir, ".bin")
    }
