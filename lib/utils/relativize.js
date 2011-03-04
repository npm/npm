
module.exports = relativize

// return the shortest path between two folders.
// if the absolute path is shorter, then use that,
// unless forceRelative is set to true.
function relativize (dest, src, forceRelative) {
  src = src.split("/")
  var abs = dest
  dest = dest.split("/")
  var i = 0
  while (src[i] === dest[i]) i++
  if (!forceRelative && i === 1) return abs // nothing in common
  src.splice(0, i + 1)
  var dots = [0, i, "."]
  for (var i = 0, l = src.length; i < l; i ++) dots.push("..")
  dest.splice.apply(dest, dots)
  if (dest[0] === "." && dest[1] === "..") dest.shift()
  dest = dest.join("/")
  return !forceRelative && abs.length < dest.length ? abs : dest
}

if (module === require.main) {
  // from, to, result, relativeForced
  var assert = require("assert")

  ; [ ["/bar"        ,"/foo"           ,"/bar"    ,"./bar"            ]
    , ["/foo/baz"    ,"/foo/bar/baz"   ,"../baz"  ,"../baz"           ]
    , ["/a/d"        ,"/a/b/c/d/e/f"   ,"/a/d"    ,"../../../../d"    ]
    , ["/a/d"        ,"/a/b/c/d/e/"    ,"/a/d"    ,"../../../../d"    ]
    , ["./foo/bar"   ,"./foo/baz"      ,"./bar"   ,"./bar"            ]
    , ["./d"         ,"./a/b/c/d/e"    ,"./d"     ,"../../../../d"    ]
    ].forEach(function (test) {
      var d = test[0]
        , s = test[1]
        , r = test[2]
        , rr = test[3]
        , ra = relativize(d, s)
        , rra = relativize(d, s, true)
      console.log([d, s, r, rr], [ra, rra], [r === ra, rr === rra])
      assert.equal(r, ra)
      assert.equal(rr, rra)
    })

  console.log("ok")
}
