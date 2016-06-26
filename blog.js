module.exports = function(app) {
	var mongoose = require('mongoose'),
		bodyParser = require('body-parser'),
		urlencodedParser = bodyParser.urlencoded({extended: false}),

		marked = require('marked'),
		pygmentize = require('pygmentize-bundled'),
		bcrypt = require('bcrypt'),
		fs = require('fs');

	var renderer = new marked.Renderer();

	renderer.code = function (text) {return text;};//the code is already formated by pygmentize, so we prevent marked from doing it too

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
		return bcrypt.compareSync(password, fs.readFileSync('hash.txt', {encoding: 'utf-8'}));
	}

	app.get(['/', '/blog'], function (req, res) {
		BlogPost.find({}, null, {sort: {_id: -1}}, function (err, postList) {
			res.render('blog_index.ejs', {postList: postList});
		});
	})
	.get('/blog/tag/:tag', function (req, res) {
		BlogPost.find({tags: req.params.tag}, null, {sort: {_id: -1}}, function (err, postList) {
			res.render('blog_index.ejs', {postList: postList});
		});
	})
	.get('/blog/write', function (req, res) {
		res.render('blog_write.ejs', {id: null, tags: null});
	})
	.get('/blog/:artclTmstp/edit', function (req, res) {
		var artId = req.params.artclTmstp;

		BlogPost.findById({$gt: artId + '0000000000000000', $lt: artId + 'ffffffffffffffff'}, function (err, article) {
			if (err) {return console.error(err);}

			res.render('blog_write.ejs', {id: artId, placeholder: article.md, tags: article.tags});

		});

	})
	.get('/blog/:artclTmstp', function (req, res, next) {
		var artId = req.params.artclTmstp;

		if(/[\da-f]{8}/.test(artId)){
			BlogPost.findById({$gt: artId + '0000000000000000', $lt: artId + 'ffffffffffffffff'}, function (err, article) {
				if (err) {return console.error(err);}

				if (article !== null) {
					res.render('blog_render.ejs', {articleTxt: article.html, tags: article.tags, lang: article.lang});
				} else {
					next();
				}
			});
		} else {
			next();
		}
	})
	.post('/blog/write', urlencodedParser, function (req, res) {
		var tags = req.body.tags;

		if (validPassword(req.body.password) && req.body.post && typeof tags === 'string' && req.body.lang) {
			tags = tags === "" ? null : tags.split(', ');

			var newPost = new BlogPost({md: req.body.post, tags: tags, lang: req.body.lang});
			marked(req.body.post, setHtmlAndSave.bind(newPost));

			res.redirect('/blog/' + newPost._id.toString().slice(0, -16));//may 404 if the markdown is slow to render
		} else {
			res.send('Wrong password!');
		}
	})
	.post('/blog/:artclTmstp/edit', urlencodedParser, function (req, res, next) {
		var artId = req.params.artclTmstp,
			tags = req.body.tags;

		if (/[\da-f]{8}/.test(artId) && validPassword(req.body.password) && req.body.post && typeof tags === 'string' && req.body.lang){
			BlogPost.findById({$gt: artId + '0000000000000000', $lt: artId + 'ffffffffffffffff'}, function (err, article) {
				if (err) {return console.error(err);}

				article.tags = tags === "" ? null : tags.split(', ');
				article.md = req.body.post;
				article.lang = req.body.lang
				marked(req.body.post, setHtmlAndSave.bind(article));

				res.redirect('/blog/' + artId);//may not be up-to-date if the markdown is slow to render
			});
		} else {
			res.send('Wrong password!');
		}
	});
};
