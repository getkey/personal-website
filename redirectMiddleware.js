const redirects = require('./redirects.json');

module.exports = async (ctx, next) => {
	const redirection = redirects[ctx.request.url];

	if (redirection !== undefined) {
		ctx.status = 301;
		ctx.redirect(redirection);
		ctx.body = `Redirecting to ${redirection}`;
	} else {
		await next();
	}
};
