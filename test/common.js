exports.rmFrom = function rmFrom (obj) {
  for (var i in obj) {
    if (i === "from")
      delete obj[i]
    else if (i === "dependencies")
      for (var j in obj[i])
        rmFrom(obj[i][j])
  }
  return obj
}