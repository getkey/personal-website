const Koa = require('koa'),
	router = require('koa-route'),
	co = require('co'),
	render = require('koa-ejs'),

	app = new Koa();

render(app, {
	root: __dirname + '/view',
	layout: false,
	viewExt: 'ejs',
	cache: false,
	debug: true
});
app.context.render = co.wrap(app.context.render);

app.use(require('koa-bodyparser')());


if (app.env === 'development') { // on prod server nginx handles this
	const serve = require('koa-static');
	app.use(serve(__dirname + '/static'));
}


require('./blog.js')(app, router);

app.use(router.get('/search', async ctx => {
	await ctx.render('search', {
		keywords: ctx.request.query.q
	});
}));

app.use(router.get('/about', async ctx => {
	await ctx.render('about');
}));

app.use(async ctx => {
	await ctx.render('404');
});



app.listen(parseInt(process.argv[2], 10));

console.log('The server is up !');
