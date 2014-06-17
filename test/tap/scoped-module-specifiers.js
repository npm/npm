var util = require("util")

var test = require("tap").test

var isOrganized = require("../../lib/utils/is-organized.js")

function Config() {
  this._store = Object.create(null)
}

Config.prototype.set = function (key, value) {
  this._store[key] = value
}

Config.prototype.get = function (key) {
  return this._store[key]
}

function isGithub(spec) {
  return !!/^[^\/]+\/[^\/]+$/.test(spec)
}

// isaacs: by way of just getting your target set, though, `@a/b` should map to
// `npm://{config.get("@a:registry-bikeshed-me")}/@a%2Fb`.  `npm://` urls are
// fetched via https, and auth is always sent (because it might be private)

// isaacs: probably there should be a single `maybeFile` thing that we
// first do with anything that has a `/` in the name

function mapRegistry(config, spec) {
  var pieces = spec.match(/^(@[^@\/])+\//)
  var org    = pieces[1]
  return config.get(org + ":registry")
}

function splitSpec(spec) {
  if (spec.slice(1).indexOf("@") !== -1) {
    var inflect = spec.lastIndexOf("@")
    var name    = spec.slice(0, inflect)
    var version = spec.slice(inflect + 1)
    return {name : name, version : version}
  }
  else {
    return {name : spec, version : "unset"}
  }
}


test("recognizing organized URLs", function (t) {
  var config = new Config()
  config.set("@a:registry", "registry.example.com")

  function canonicalize(spec) {
    var expanded = splitSpec(spec)
    if (isOrganized(expanded.name)) {
      return util.format(
        "npm://%s/%s, v: %s",
        mapRegistry(config, expanded.name),
        expanded.name.replace("/", "%2f"),
        expanded.version
      )
    }
    else if (isGithub(expanded.name)) {
      return util.format(
        "git+ssh:git@github.com:%s, v: %s",
        expanded.name,
        expanded.version
      )
    }
    return util.format("%s, v: %s", expanded.name, expanded.version)
  }

  t.equals(canonicalize("a/b"),           "git+ssh:git@github.com:a/b, v: unset")
  t.equals(canonicalize("@a/b"),          "npm://registry.example.com/@a%2fb, v: unset")
  t.equals(canonicalize("a/b@latest"),    "git+ssh:git@github.com:a/b, v: latest")
  t.equals(canonicalize("@a/b@latest"),   "npm://registry.example.com/@a%2fb, v: latest")
  t.equals(canonicalize("@a@1.0.0"),      "@a, v: 1.0.0")
  t.equals(canonicalize("@a/b@'^1.0.0'"), "npm://registry.example.com/@a%2fb, v: '^1.0.0'")
  t.end()
})
