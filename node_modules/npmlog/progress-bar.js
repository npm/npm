"use strict"

var ProgressBar = module.exports = function (cursor) {
  this.cursor = cursor
  this.showing = false
  this.barPrefix = "╢"
  this.barSuffix = "╟"
  this.barComplete = "▓"
  this.barIncomplete = "░"
  this.spinner = "◴◷◶◵"
  this.lastName = ""
  this.lastCompleted = 0
  this.spinning = null
  this.spun = 0
  this.last = new Date(0)
}
ProgressBar.prototype = {}

ProgressBar.prototype.hide = function() {
  if (!process.stdout.isTTY) return
  this.cursor.show()
  if (this.showing) this.cursor.up(1)
  this.cursor.horizontalAbsolute(0).eraseLine()
  this.showing = false
}

var repeat = function (str, count) {
  var out = ''
  for (var ii=0; ii<count; ++ii) out += str
  return out
}

ProgressBar.prototype.pulse = function(name) {
  ++ this.spun
  var baseName = this.lastName
  this.show(baseName ? baseName + " → " + name : null)
  this.lastName = baseName
}

ProgressBar.prototype.startSpinner = function () {
  this.spinning = true
}

ProgressBar.prototype.stopSpinner = function () {
  if (!this.spinning) return
  this.spinning = null
}

ProgressBar.prototype.show = function(name, completed) {
  if (!process.stdout.isTTY) return
  if (this.showing && new Date() - this.last < 50) return

  completed = this.lastCompleted = completed || this.lastCompleted
  if (! this.spinning && ! completed) return

  if (! name) name = this.lastName

  this.lastName = name
  this.last = new Date()

  name = name ? name + " " : ""

  var spinner = ""
  if (this.spinning) {
    spinner = this.spinner.substr(this.spun % this.spinner.length,1) + " "
  }

  var nonBarLen = name.length
                + spinner.length
                + this.barPrefix.length
                + this.barSuffix.length

  var barLen = process.stdout.columns - nonBarLen
  var sofar = Math.round(barLen * completed)
  var rest = barLen - sofar

  var statusline
    = name
    + spinner
    + (completed
        ? this.barPrefix
        + repeat(this.barComplete, sofar)
        + repeat(this.barIncomplete, rest)
        + this.barSuffix
        : "")
    + "\n"

  if (this.showing) this.cursor.up(1)
  this.cursor.hide().horizontalAbsolute(0).write(statusline).show()

  this.showing = true
}
