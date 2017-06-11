function panic(message) {
	console.error(message);
	process.exit(1);
}
module.exports.panic = panic;
module.exports.usagePanic = (usage, errMsg) => {
	panic(`Usage: \`${process.argv[0]} ${process.argv[1]} ${usage}\`
${errMsg}`);
};
