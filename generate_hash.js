var bcrypt = require('bcrypt'),
	fs = require('fs');
process.stdin.setEncoding('utf8');
process.stdin.setRawMode(true);

console.log('You have to write your password all at once; backspaces are not handled.');

process.stdout.write('Password: ');

var pw = '',
	vpw = '',
	toBeVerified = false;
process.stdin.on('data', function(char) {
	switch (char) {
		case '\u0003'://^C
			process.stdout.write('\n');
			process.exit();
			break;
		case '\n':
		case '\r':
			process.stdout.write('\n');
			if (toBeVerified) {
				if (pw === vpw) saveHash(pw);
				else {
					console.log('Password does not match. Exiting...');
					process.exit();
				}
			} else {
				toBeVerified = true;
				process.stdout.write('Confirm password: ');
			}
			break;
		default:
			if (!toBeVerified) pw += char;
			else vpw += char;
	}
});

function saveHash(password) {
	var salt = bcrypt.genSaltSync(10),
		hash = bcrypt.hashSync(password, salt);

	console.time('Bcrypt comparison time');
	var passwordMatch = bcrypt.compareSync(password, hash);
	console.timeEnd('Bcrypt comparison time');

	if (!passwordMatch) console.log('Something went wrong, please try again');
	else {
		fs.writeFileSync('hash.txt', hash);
		console.log('Saved the hash of your password in hash.txt');
	}

	process.exit();
}
