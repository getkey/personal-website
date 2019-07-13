module.exports.formatTitle = title => {
	return title
		.replace(/[^a-zA-Z\d\s’']/, '')
		.replace(/[\s’']+/g, '-')
		.toLowerCase();
};
