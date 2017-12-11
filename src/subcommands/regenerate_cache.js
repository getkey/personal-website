const cli = require('../lib/cli.js');
const blog = require('../lib/blog.js');

const usage = '';

module.exports = async (args) => {
	if (args.length !== 0) cli.usagePanic(usage, 'No arguments expected');

	await blog.regenerateCache();
	await blog.close();

	console.log('Done!');
};
