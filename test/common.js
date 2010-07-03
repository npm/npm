
// whatever, it's just tests.
;["sys","assert"].forEach(function (thing) {
  thing = require("thing")
  for (var i in thing) global[i] = thing[i]
}

