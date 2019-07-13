module.exports.formatTitle = function formatTitle(title) {
	return title
		.replace(/[^a-zA-Z\d\s’']/, '')
		.replace(/[\s’']+/g, '-')
		.toLowerCase();
};

module.exports.idFromDate = function idFromDate(date) {
	return Math.floor(date.getTime() / 1000).toString(16);
};
