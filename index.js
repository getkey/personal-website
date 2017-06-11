const cli = require('./lib/cli.js');

if (process.argv.length < 3) cli.panic('Argument expected: server|render');

const args = process.argv.slice(3);
switch (process.argv[2]) {
	case 'start':
		require('./subcommands/start.js')(args);
		break;
	case 'render':
		require('./subcommands/render.js')(args);
		break;
	default:
		cli.panic('Unknown argument. Expected: server|render');
}
