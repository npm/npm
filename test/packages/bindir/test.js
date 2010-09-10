// ${npm_config_binroot}/prog @ -> ./prog-${npm_package_version}
// ${npm_config_binroot}/prog-${npm_package_version} = shim

var path = require("path")
  , assert = require("assert")
  , root = process.env.npm_config_root
  , binroot = process.env.npm_config_binroot
  , name = process.env.npm_package_name
  , version = process.env.npm_package_version
  , prog = path.join(binroot, "prog")
  , progVer = path.join(binroot, "prog@"+version)
  , bin = path.join(root, ".npm", name, version, "package", "bin", "prog.js")

assert.equal(require(bin), require(progVer), "require('"+ bin +"') !== require('"+ progVer +"')")
assert.equal(require(prog), require(progVer), "require('"+ prog +"') !== require('"+ progVer +"')")
assert.equal(require(bin), require(prog), "require('"+ bin +"') !== require('"+ prog +"')")
