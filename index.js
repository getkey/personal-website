const cli = require('./lib/cli.js');

const subcommandPaths = {
	start: './subcommands/start.js',
	'regenerate-cache': './subcommands/regenerate_cache.js',
	'set-password': './subcommands/generate_hash.js',
};
const panicString = `Argument expected: ${Object.keys(subcommandPaths).join('|')}`;

if (process.argv.length < 3) cli.panic(panicString);

const subcommand = subcommandPaths[process.argv[2]];
if (subcommand === undefined) cli.panic(panicString);

const args = process.argv.slice(3);
require(subcommand)(args);
