const cli = require('../lib/cli.js'),
	auth = require('../lib/auth.js');

process.stdin.setEncoding('utf8');
process.stdin.setRawMode(true);

function getPassword() {
	return new Promise((resolve, reject) => {
		let password = '';

		function dataHandler(char) {
			switch (char) {
				case '\u0003'://^C
					process.stdout.write('\n');
					process.exit();
					break;
				case '\n':
				case '\r':
					process.stdout.write('\n');
					removeHandlers();
					resolve(password);
					break;
				default:
					password += char;
			}
		}
		function errorHandler(err) {
			removeHandlers();
			reject(err);
		}
		function removeHandlers() {
			process.stdin.removeListener('data', dataHandler);
			process.stdin.removeListener('error', errorHandler);
		}
		process.stdin.on('data', dataHandler);
		process.stdin.on('error', errorHandler);
	});
}

module.exports = async () => {
	console.log('You have to write your password all at once; backspaces are not handled.');

	process.stdout.write('Password: ');
	const password = await getPassword();

	console.log('Confirm password: ');
	const confirmationpassword = await getPassword();

	if (password !== confirmationpassword) cli.panic('Password does not match. Exiting...');

	const hash = auth.generateHash(password);
	auth.benchmark(password, hash);
	auth.save(hash);
	console.log('Saved the hash of your password in hash.txt');

	process.stdin.unref(); // https://stackoverflow.com/questions/26004519/why-doesnt-my-node-js-process-terminate-once-all-listeners-have-been-removed
};
