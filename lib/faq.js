
module.exports = faq

faq.usage = "npm faq"

var npm = require("../npm")

function faq (args, cb) { npm.commands.help(["faq"], cb) }
