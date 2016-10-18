module.exports = function(app, router) {
	const mongoose = require('mongoose'),
		marked = require('marked'),
		pygmentize = require('pygmentize-bundled'),
		bcrypt = require('bcrypt'),
		fs = require('fs');

    mongoose.Promise = global.Promise;

	var renderer = new marked.Renderer();

	renderer.code = function (text) {
		return text; // the code is already formated by pygmentize, so we prevent marked from doing it too
	};

	renderer.heading = function(text, level) {//I don't want to have ids in my titles
		return '<h' + level + '>'
		+ text
		+ '</h' + level +'>\n';
	};

	marked.setOptions({
		renderer: renderer,
		gfm: true,
		tables: true,
		breaks: true,
		pedantic: false,
		sanitize: true,
		smartLists: true,
		smartypants: true,
		highlight: function (code, lang, callback) {
			pygmentize({lang: lang, format: 'html'}, code, function (err, result) {
				callback(err, result.toString());
			});
		}
	});



	mongoose.connect('mongodb://localhost/blog');

	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'Mongoose: Connection error:'));


	var blogPostSchema = new mongoose.Schema({
		html: String,
		md: String,
		tags: [String],
		lang: String
	});

	var BlogPost = mongoose.model('BlogPost', blogPostSchema);

	function setHtmlAndSave(err, content) {
		//don't forget to `bind(blogpost);`
		if (err) {throw err};

		var dayArray = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
			monthArray = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'December'],

		postDate = this._id.getTimestamp(),

		addAt = content.indexOf('</h1>');
		addAt += 5;//the end of the tab is 5 row further

		var tmpDateStr = '\n<time datetime="' + postDate.toISOString() + '" pubdate>' + dayArray[postDate.getUTCDay()] + ' ' + postDate.getUTCDate() + ' ' + monthArray[postDate.getUTCMonth()] + ' ' + postDate.getUTCFullYear() + '</time>\n';

		content = content.substr(0, addAt) + tmpDateStr + content.substr(addAt);

		this.html = content;

		this.save(function (err) {
			if (err) {return console.error(err);}
		});

	}

	function validPassword(password) {
		if (password === undefined) return false;

		return bcrypt.compareSync(password, fs.readFileSync('hash.txt', {encoding: 'utf-8'}));
	}

	app.use(router.get(['/', '/blog'], async ctx => {
		let postList = await BlogPost.find({}, null, {sort: {_id: -1}});
		await ctx.render('blog_index', {
			postList: postList
		});
	}));

	app.use(router.get('/blog/tag/:tag', async (ctx, tag) => {
		let postList = await BlogPost.find({tags: tag}, null, {sort: {_id: -1}});
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
	app.use(router.post('/blog/write', async ctx => {
		let tags = ctx.request.body.tags,
			password = ctx.request.body.password,
			post = ctx.request.body.post,
			lang = ctx.request.body.lang;

		if (post !== undefined && tags !== undefined && lang !== undefined && validPassword(password)) {
			tags = tags === "" ? null : tags.split(', ');

			var newPost = new BlogPost({
				md: post,
				tags,
				lang
			});
			marked(post, setHtmlAndSave.bind(newPost));

			ctx.redirect('/blog/' + newPost._id.toString().slice(0, -16)); // may 404 if the markdown is slow to render
		} else {
			await ctx.render('wrong_password');
		}
	}));

	app.use(router.get('/blog/:artclTmstp', async (ctx, artId, next) => {
		if (/[\da-f]{8}/.test(artId)) {
			let article = await BlogPost.findById({
				$gt: artId + '0000000000000000',
				$lt: artId + 'ffffffffffffffff'
			});

			if (article !== null) {
				await ctx.render('blog_render', {
					articleTxt: article.html,
					tags: article.tags, lang: article.lang
				});
			} else {
				await next();
			}
		} else {
			await next();
		}
	}));
	app.use(router.get('/blog/:artclTmstp/edit', async (ctx, artId) => {
		let article = await BlogPost.findById({
			$gt: artId + '0000000000000000',
			$lt: artId + 'ffffffffffffffff'
		});

		await ctx.render('blog_write', {
			id: artId,
			placeholder: article.md,
			tags: article.tags
		});
	}));

	app.use(router.post('/blog/:artclTmstp/edit', async (ctx, artId) => {
		let tags = ctx.request.body.tags,
			password = ctx.request.body.password,
			post = ctx.request.body.post,
			lang = ctx.request.body.lang;

		if (/[\da-f]{8}/.test(artId) && post !== undefined && tags !== undefined && lang !== undefined && validPassword(password)) {
			let article = await BlogPost.findById({
				$gt: artId + '0000000000000000',
				$lt: artId + 'ffffffffffffffff'
			});
			if (err) {return console.error(err);}

			article.tags = tags === "" ? null : tags.split(', ');
			article.md = post;
			article.lang = lang
			marked(post, setHtmlAndSave.bind(article));

			ctx.redirect('/blog/' + artId);//may not be up-to-date if the markdown is slow to render
		} else {
			await ctx.render('wrong_password');
		}
	}));
};
