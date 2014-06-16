module.exports = isOrganized

function isOrganized(spec) {
  return !!/^@[^@\/]+\//.test(spec)
}
