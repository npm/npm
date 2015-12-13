var proxyquire = require('proxyquire');
module.exports = proxyquire('fs-extra', {
	'copy': proxyquire('fs-extra/lib/copy', {
		'ncp': require('graceful-ncp')
	}),
	'move': proxyquire('fs-extra/lib/move', {
		'ncp': require('graceful-ncp')
	})
});

