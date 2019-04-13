const fs = require('fs'),
	bcrypt = require('bcrypt');

const HASH_FILE_PATH = 'hash.txt';

module.exports.benchmark = async (password, hash) => {
	console.time('Bcrypt comparison time');
	await bcrypt.compare(password, hash);
	console.timeEnd('Bcrypt comparison time');
};
module.exports.generateHash = password => {
	const salt = bcrypt.genSaltSync(10);

	return bcrypt.hashSync(password, salt);
};
module.exports.valid = async password => {
	const hash = fs.readFileSync(HASH_FILE_PATH, 'utf-8');
	return await bcrypt.compare(password, hash);
};
module.exports.save = hash => {
	fs.writeFileSync(HASH_FILE_PATH, hash);
};
