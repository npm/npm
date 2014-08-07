var status_bar = require('status-bar')
var storage = [" B", " kB", " MB", " GB", " TB", " PB", " EB", " ZB", " YB"]

var P = Progress.prototype

function Progress() {
	if (!(this instanceof Progress)) return new Progress()
	var self = this
	this.streams = []
	this.enabled = false
	this.requests_count = 0
	this.requests_finished = 0
	this.requests_total = 0
	this.have_progressbar = false
	this.our_output = false

	this.control = status_bar.create({
		total: Infinity,
		render: function (stats) {
			return format_speed(stats.speed) + ' [' + self.requests_finished + '/' + self.requests_total + ']'
		},
		frequency: 0, // disable first setInterval there
	})
	this.control._elapsedTimer = {}; // disable second setInterval
	this.streams.push(this.control)
	this.interval = false

	process.on('exit', function exit() {
		if (self.have_progressbar) self.update()
		if (self.have_progressbar) self.write('\n')
	})
}

P.enable = function(interval) {
	if (this.interval) {
		clearInterval(this.interval)
	}
	if (interval) {
		if (!Number.isFinite(interval)) interval = 100
		this.interval = setInterval(this.update.bind(this), interval)
		this.interval.unref()
	}
	this.enabled = !!interval
	return this
}

P.intercept = function(stream) {
	var self = this
	var old_write = stream.write
	stream.write = function() {
		if (self.our_output || !self.have_progressbar)
			return old_write.apply(stream, arguments)

		self.have_progressbar = false
		self.write('\033[2K\r')
		old_write.apply(stream, arguments)
		process.nextTick(function() {
			self.update()
		})
	}
	return this
}

P.output = function(stream) {
	this.stream = stream
	return this
}

P.write = function() {
	this.our_output = true
	this.stream.write.apply(this.stream, arguments)
	this.our_output = false
	return this
}

P.add = function(slug, req) {
	var bar, is_index = false, counted, self = this
	self.requests_total++

	req.on('response', function(res) {
		self.requests_count++
		counted = true
		if (res.headers && res.headers['content-length'] && !is_index) {
			bar = new_stream(slug, res.headers['content-length'])
			self.streams.push(bar)
		}
	})

	req.on('data', function(data) {
		self.control.update(data)
		if (bar && !is_index) {
			bar.update(data)
		}
	})

	req.on('end', end)
	req.on('error', end)

	function end() {
		self.requests_finished++
		if (counted) {
			counted = false
			self.requests_count--
		}

		if (!bar) return
		bar.cancel()
		self.streams.splice(self.streams.indexOf(bar), 1)
		bar = null
	}
	return this
}

P.update = function() {
	if (!this.enabled) return this
	if (this.requests_total === this.requests_finished) {//!requests_count) {
		if (this.have_progressbar) this.write('\033[2K\r')
		this.have_progressbar = false
		return this
	}
	var res = this.streams.map(function(s) {
		if (!s) return
		if (s._render) return s._render(s._stats)
	}).filter(function(x){return !!x}).join(' ')
	this.write('\033[2K\r' + res.substr(0, this.stream.columns - 1))
	this.have_progressbar = true
	return this
}

function format_storage(b) {
	var unit = function (n, arr, pow) {
		if (n < pow) return n + arr[0]
		var i = 1
		while (i < 9) {
			n /= pow
			var decimals = n < 100 ? 1 : 0
			if (n < pow) return n.toFixed(decimals) + arr[i]
			i++
		}
		return ">=" + pow + arr[7]
	}
	return unit (~~b, storage, 1024)
}

function format_speed(b, decimals) {
	var str = format_storage(b, decimals) + '/s'
	return Array(Math.max(10-str.length, 0)).join(' ') + str
}

function new_stream(name, total) {
	var bar = status_bar.create({
		total: total,
		render: function (stats) {
			return '[' +
				name + ': ' +
				format_storage(stats.currentSize) +
				'/' +
				format_storage(stats.totalSize) +
			']'
		},
		frequency: 0, // disable first setInterval there
	})
	bar._elapsedTimer = {}; // disable second setInterval
	bar.update(0)
	return bar
}

module.exports = new Progress()

