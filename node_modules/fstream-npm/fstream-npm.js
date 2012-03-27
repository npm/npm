var Ignore = require("fstream-ignore")
, inherits = require("inherits")
, path = require("path")

module.exports = Packer

inherits(Packer, Ignore)

function Packer (props) {
  if (!(this instanceof Packer)) {
    return new Packer(props)
  }

  if (typeof props === "string") {
    props = { path: props }
  }

  props.ignoreFiles = [ ".npmignore",
                        ".gitignore",
                        "package.json" ]

  Ignore.call(this, props)

  this.package = props.package

  // in a node_modules folder, resolve symbolic links to
  // bundled dependencies when creating the package.
  props.follow = this.follow = this.basename === "node_modules"
  // console.error("follow?", this.path, props.follow)


  this.on("entryStat", function (entry, props) {
    // files should *always* get into tarballs
    // in a user-writable state, even if they're
    // being installed from some wackey vm-mounted
    // read-only filesystem.
    entry.mode = props.mode = props.mode | 0200
  })
}

Packer.prototype.applyIgnores = function (entry, partial) {

  // package.json files can never be ignored.
  if (entry === "package.json") return true

  // in a node_modules folder, we only include bundled dependencies
  // also, prevent packages in node_modules from being affected
  // by rules set in the containing package, so that
  // bundles don't get busted.
  if (this.basename === "node_modules") {
    if (entry.indexOf("/") === -1) {
      var bd = this.package && this.package.bundleDependencies
      var shouldBundle = bd && bd.indexOf(entry) !== -1
      // console.error("should bundle?", shouldBundle, this.package)
      return shouldBundle
    }
    return true
  }

  // some files are *never* allowed under any circumstances
  if (entry === ".git" ||
      entry === ".lock-wscript" ||
      entry.match(/^\.wafpickle-[0-9]+$/) ||
      entry === "CVS" ||
      entry === ".svn" ||
      entry === ".hg" ||
      entry.match(/^\..*\.swp$/) ||
      entry === ".DS_Store" ||
      entry.match(/^\._/) ||
      entry === "npm-debug.log"
    ) {
    return false
  }

  return Ignore.prototype.applyIgnores.call(this, entry, partial)
}

Packer.prototype.addIgnoreFiles = function () {
  var entries = this.entries
  // if there's a .npmignore, then we do *not* want to
  // read the .gitignore.
  if (-1 !== entries.indexOf(".npmignore")) {
    var i = entries.indexOf(".gitignore")
    if (i !== -1) {
      entries.splice(i, 1)
    }
  }

  this.entries = entries

  Ignore.prototype.addIgnoreFiles.call(this)
}

Packer.prototype.readRules = function (buf, e) {
  if (e !== "package.json") {
    return Ignore.prototype.readRules.call(this, buf, e)
  }

  var p = this.package = JSON.parse(buf.toString())
  this.packageRoot = true
  this.emit("package", p)

  // make bundle deps predictable
  if (p.bundledDependencies && !p.bundleDependencies) {
    p.bundleDependencies = p.bundledDependencies
    delete p.bundledDependencies
  }

  if (!p.files || !Array.isArray(p.files)) return []

  // ignore everything except what's in the files array.
  return ["*"].concat(p.files.map(function (f) {
    return "!" + f
  }))
}

Packer.prototype.getChildProps = function (stat) {
  var props = Ignore.prototype.getChildProps.call(this, stat)

  props.package = this.package

  // Directories have to be read as Packers
  // otherwise fstream.Reader will create a DirReader instead.
  if (stat.isDirectory()) {
    props.type = this.constructor
  }

  // only follow symbolic links directly in the node_modules folder.
  props.follow = false
  return props
}


var order =
  [ "package.json"
  , ".npmignore"
  , ".gitignore"
  , /^README(\.md)?$/
  , "LICENCE"
  , "LICENSE"
  , /\.js$/ ]

Packer.prototype.sort = function (a, b) {
  for (var i = 0, l = order.length; i < l; i ++) {
    var o = order[i]
    if (typeof o === "string") {
      if (a === o) return -1
      if (b === o) return 1
    } else {
      if (a.match(o)) return -1
      if (b.match(o)) return 1
    }
  }

  // deps go in the back
  if (a === "node_modules") return 1
  if (b === "node_modules") return -1

  return Ignore.prototype.sort.call(this, a, b)
}



Packer.prototype.emitEntry = function (entry) {
  if (this._paused) {
    this.once("resume", this.emitEntry.bind(this, entry))
    return
  }

  // if there is a .gitignore, then we're going to
  // rename it to .npmignore in the output.
  if (entry.basename === ".gitignore") {
    entry.basename = ".npmignore"
    entry.path = path.resolve(entry.dirname, entry.basename)
  }

  // skip over symbolic links if we're not in the node_modules
  // folder doing bundle whatevers
  if (this.basename !== "node_modules" && entry.type === "SymbolicLink") {
    return
  }

  if (entry.type !== "Directory") {
    // make it so that the folder in the tarball is named "package"
    var h = path.dirname((entry.root || entry).path)
    , t = entry.path.substr(h.length + 1).replace(/^[^\/\\]+/, "package")
    , p = h + "/" + t

    entry.path = p
    entry.dirname = path.dirname(p)
    return Ignore.prototype.emitEntry.call(this, entry)
  }

  // we don't want empty directories to show up in package
  // tarballs.
  // don't emit entry events for dirs, but still walk through
  // and read them.  This means that we need to proxy up their
  // entry events so that those entries won't be missed, since
  // .pipe() doesn't do anythign special with "child" events, on
  // with "entry" events.
  var me = this
  entry.on("entry", function (e) {
    if (e.parent === entry) {
      e.parent = me
      me.emit("entry", e)
    }
  })
  entry.on("package", this.emit.bind(this, "package"))
}
