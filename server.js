const Koa = require('koa'),
	router = require('koa-route'),
	co = require('co'),
	render = require('koa-ejs'),
	blog = require('./blog.js'),

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



app.use(router.get('/search', async ctx => {
	await ctx.render('search', {
		keywords: ctx.request.query.q
	});
}));

app.use(router.get('/about', async ctx => {
	await ctx.render('about');
}));


async function handleSavingError(err, ctx, next) {
	switch (err.message) {
		case 'Wrong password':
			await ctx.render('wrong_password');
			break;
		case 'Article doesn\'t exist':
			await next()
			break;
		default:
			console.error(err);
	}
}
app.use(router.get(['/', '/blog'], async ctx => {
	let postList = await blog.getAllArticles();
	await ctx.render('blog_index', {
		postList: postList
	});
}));

app.use(router.get('/blog/tag/:tag', async (ctx, tag) => {
	let postList = await blog.getArticlesByTag(tag);
	await ctx.render('blog_index', {
		postList: postList
	});
}));

app.use(router.get('/blog/write', async ctx => {
	await ctx.render('blog_write', {
		id: null,
		tags: null
	});
}));
app.use(router.post('/blog/write', async (ctx, next) => {
	try {
		let id = await blog.saveArticle(
			tags = ctx.request.body.tags,
			password = ctx.request.body.password,
			post = ctx.request.body.post,
			lang = ctx.request.body.lang
		);

		ctx.redirect('/blog/' + id);
	} catch (err) {
		await handleSavingError(err, ctx, next);
	}
}));

app.use(router.get('/blog/:artclTmstp', async (ctx, id, next) => {
	let article = await blog.getArticleById(id);

	if (article === null) await next();
	else await ctx.render('blog_render', {
		articleTxt: article.html,
		tags: article.tags, lang: article.lang
	});
}));
app.use(router.get('/blog/:artclTmstp/edit', async (ctx, id) => {
	let article = await blog.getArticleById(id);

	if (article === null) await next();
	else await ctx.render('blog_write', {
		id: id,
		placeholder: article.md,
		tags: article.tags
	});
}));

app.use(router.post('/blog/:artclTmstp/edit', async (ctx, reqId, next) => {
	try {
		let id = await blog.saveArticle(
			tags = ctx.request.body.tags,
			password = ctx.request.body.password,
			post = ctx.request.body.post,
			lang = ctx.request.body.lang,
			reqId
		);

		ctx.redirect('/blog/' + id);
	} catch (err) {
		await handleSavingError(err, ctx, next);
	}
}));


app.use(async ctx => {
	await ctx.render('404');
});

app.listen(parseInt(process.argv[2], 10));

console.log('The server is up !');
