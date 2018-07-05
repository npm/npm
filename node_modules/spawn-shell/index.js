'use strict';

const childProcess = require('child_process');
const defaultShell = require('default-shell');
const merge = require('merge-options');
const npmRunPath = require('npm-run-path');

const spawn = childProcess.spawn;

const defaultOptions = {
	env: {},
	stdio: [0, 1, 2],
	windowsVerbatimArguments: process.platform === 'win32'
};

module.exports = spawnShell;

function shellFlags() {
	if (process.platform === 'win32') {
		return ['/d', '/s', '/c'];
	}
	return ['-c'];
}

function resolveOnProcessExit(p) {
	return new Promise((resolve, reject) => {
		let fullFilled = false;
		p.on('error', err => {
			fullFilled = true;
			reject(err);
		});

		p.on('exit', exitCode => {
			if (!fullFilled) {
				resolve(exitCode);
			}
		});
	});
}

function spawnShell(command, options) {
	const opts = merge({}, defaultOptions, options);
	const shell = opts.shell || defaultShell;
	delete opts.shell;

	opts.env.PATH = npmRunPath({path: opts.env.PATH});
	const p = spawn(
		shell,
		shellFlags().concat(command),
		opts
	);
	p.exitPromise = resolveOnProcessExit(p);
	return p;
}
