const Koa = require('koa'),
	router = require('koa-route'),
	render = require('koa-ejs'),
	blog = require('./blog.js'),
	app = new Koa();

render(app, {
	root: __dirname + '/../view',
	layout: false,
	viewExt: 'ejs',
	cache: app.env === 'production',
});

app.use(require('koa-bodyparser')());


if (app.env === 'development') { // on prod server nginx handles this
	const serve = require('koa-static');
	app.use(serve(__dirname + '/../static'));
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
		case 'Article doesn\'t exist':
			await next();
			break;
		default:
			await ctx.render('saving_error', {
				err
			});
	}
}
app.use(router.get('/', async ctx => {
	ctx.status = 307;
	ctx.redirect('/blog');
	ctx.body = 'Redirecting to the blog';
}));
app.use(router.get('/blog', async ctx => {
	await ctx.render('blog_index', {
		postList: await blog.getAllArticles(),
		formatTitle: blog.formatTitle
	});
}));

app.use(router.get('/blog/tag/:tag', async (ctx, tag) => {
	await ctx.render('blog_index', {
		postList: await blog.getArticlesByTag(tag),
		formatTitle: blog.formatTitle
	});
}));

app.use(router.get('/blog/atom.xml', async ctx => {
	await ctx.render('atom', {
		postList: await blog.getAllArticles()
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
			ctx.request.body.tags,
			ctx.request.body.password,
			ctx.request.body.post,
			ctx.request.body.lang
		);

		ctx.redirect('/blog/' + id);
	} catch (err) {
		console.log(err);
		await handleSavingError(err, ctx, next);
	}
}));

app.use(router.get('/blog/:artclTmstp', async (ctx, id, next) => {
	let article = await blog.getArticleById(id);

	if (article === null) await next();
	else ctx.redirect('/blog/' + id + '/' + blog.formatTitle(article.title));
}));
app.use(router.get('/blog/:artclTmstp/edit', async (ctx, id, next) => {
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
			ctx.request.body.tags,
			ctx.request.body.password,
			ctx.request.body.post,
			ctx.request.body.lang,
			reqId
		);

		ctx.redirect('/blog/' + id);
	} catch (err) {
		console.log(err);
		await handleSavingError(err, ctx, next);
	}
}));
app.use(router.get('/blog/:artclTmstp/:artclTitle', async (ctx, id, title, next) => {
	let article = await blog.getArticleById(id);

	if (article === null || blog.formatTitle(article.title) !== title) await next();
	else await ctx.render('blog_render', {
		title: article.title,
		date: article._id.getTimestamp(),
		bodyCopy: article.cache.content,
		tags: article.tags,
		lang: article.lang
	});
}));


app.use(async ctx => {
	await ctx.render('404');
});

module.exports = port => {
	app.listen(port);

	console.log('The server is up on port ' + port + ' !');
};
