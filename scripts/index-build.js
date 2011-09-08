#!/usr/bin/env node
var fs = require("fs")
  , path = require("path")
  , docdir = path.resolve(__dirname, "..", "doc")

console.log(
  "npm-index(1) -- Index of all npm documentation\n" +
  "==============================================\n")
fs.readdir(docdir, function (er, docs) {
  if (er) throw er
  ;["../README.md"].concat(docs.filter(function (d) {
    return d !== "index.md"
         && d.charAt(0) !== "."
         && d.match(/\.md$/)
  })).forEach(function (d) {
    var doc = path.resolve(docdir, d)
      , s = fs.lstatSync(doc)
      , content = fs.readFileSync(doc, "utf8").split("\n\n")
      , syn
      , desc

    if (s.isSymbolicLink()) return

    content.forEach(function (c, i) {
      c = c.trim()
      //console.log([c, i])
      if (c === "## SYNOPSIS") syn = content[i + 1]
      if (c === "## DESCRIPTION") syn = content[i + 1]
    })
    console.log(d.replace(/^.*?([^\/]*)\.md$/, "## npm-$1(1)") + "\n")
    if (desc) console.log(desc + "\n")
    else if (syn) console.log(syn + "\n")
  })
})
