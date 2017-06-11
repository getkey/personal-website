const cli = require('../lib/cli.js');

const usage = 'port';

module.exports = function(args) {
	if (args.length === 0) cli.usagePanic(usage, 'The port must be supplied');
	if (args.length > 1) cli.usagePanic(usage, 'Only the port must be supplied');
	let port = parseFloat(args[0]);
	if (Number.isInteger(port) !== true) cli.usagePanic(usage, 'The port must be a valid number');

	require('../lib/server.js')(port);
};
