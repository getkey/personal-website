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
app.use(require('../redirectMiddleware.js'));


if (app.env === 'development') { // on prod server nginx handles this
	const serve = require('koa-static');
	app.use(serve(__dirname + '/../static'));
}



app.use(router.get('/search', async ctx => {
	await ctx.render('search', {
		keywords: ctx.request.query.q,
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
			ctx.status = 500;
			await ctx.render('error', {
				type: 'Saving error',
				err,
			});
	}
}
app.use(router.get('/', async ctx => {
	ctx.status = 307;
	ctx.body = 'Redirecting to the blog';
	ctx.redirect('/blog');
}));
app.use(router.get('/blog', async ctx => {
	await ctx.render('blog_index', {
		postList: await blog.getArticles(),
		formatTitle: blog.formatTitle,
	});
}));

app.use(router.get('/blog/tag/:tag', async (ctx, tag) => {
	await ctx.render('blog_index', {
		postList: await blog.getArticles(tag),
		formatTitle: blog.formatTitle,
	});
}));

app.use(router.get('/blog/atom.xml', async ctx => {
	await ctx.render('atom', {
		postList: await blog.getArticles(),
	});
}));


app.use(router.get('/blog/write', async ctx => {
	await ctx.render('blog_write', {
		dest: ctx.request.path, // post to same path
		tags: null,
	});
}));
app.use(router.post('/blog/write', async (ctx, next) => {
	try {
		let article = await blog.saveArticle(
			ctx.request.body.tags,
			ctx.request.body.password,
			ctx.request.body.post,
			ctx.request.body.lang
		);

		ctx.redirect(`/blog/${article.cache.id}/${blog.formatTitle(article.cache.title)}`);
	} catch (err) {
		console.error(err);
		await handleSavingError(err, ctx, next);
	}
}));

app.use(router.get('/blog/:artclTmstp', async (ctx, id, next) => {
	let article = await blog.getArticleById(id);

	if (article === null) await next();
	else ctx.redirect('/blog/' + id + '/' + blog.formatTitle(article.cache.title));
}));
app.use(router.get('/blog/:artclTmstp/:artclTitle', async (ctx, id, title, next) => {
	let article = await blog.getArticleById(id);

	if (article === null || blog.formatTitle(article.cache.title) !== title) await next();
	else if (ctx.request.query.edit !== undefined) {
		await ctx.render('blog_write', {
			dest: ctx.request.path + ctx.request.search, // post to same path
			placeholder: article.md,
			tags: article.tags,
		});
	} else {
		await ctx.render('blog_render', {
			title: article.cache.title,
			date: article.date,
			bodyCopy: article.cache.content,
			tags: article.tags,
			lang: article.lang,
		});
	}
}));
app.use(router.post('/blog/:artclTmstp/:artclTitle', async (ctx, id, title, next) => {
	// note: any title is accepted as the destination as long as the id matches.
	// The id is unique, but the title may have been modified so it can't be checked.
	if (ctx.request.query.edit === undefined) {
		ctx.status = 400;
		await ctx.render('error', {
			type: 'Wrong query',
			err: 'Invalid query submitted.',
		});
		return await next();
	}

	try {
		let article = await blog.saveArticle(
			ctx.request.body.tags,
			ctx.request.body.password,
			ctx.request.body.post,
			ctx.request.body.lang,
			id,
		);

		ctx.redirect(`/blog/${article.cache.id}/${blog.formatTitle(article.cache.title)}`);
	} catch (err) {
		console.error(err);
		await handleSavingError(err, ctx, next);
	}
}));


app.use(async ctx => {
	ctx.status = 404;
	await ctx.render('404');
});

module.exports = port => {
	app.listen(port);

	console.log('The server is up on port ' + port + ' !');
};
