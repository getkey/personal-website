const mongoose = require('mongoose'),
	marked = require('marked'),
	bcrypt = require('bcrypt'),
	fs = require('fs');

mongoose.Promise = global.Promise;

mongoose.connect('mongodb://localhost/blog');
mongoose.connection.on('error', console.error.bind(console, 'Mongoose: Connection error:'));


let blogPostSchema = new mongoose.Schema({
	title: String,
	html: String,
	md: String,
	tags: [String],
	lang: String
});

let BlogPost = mongoose.model('BlogPost', blogPostSchema);

function validPassword(password) {
	if (password === undefined) return false;

	return bcrypt.compareSync(password, fs.readFileSync('hash.txt', {encoding: 'utf-8'}));
}
function validId(id) {
	return /[\da-f]{8}/.test(id);
}

module.exports.getAllArticles = async () => {
	return await BlogPost.find({}, null, {sort: {_id: -1}});
};

module.exports.getArticlesByTag = async tag => {
	return await BlogPost.find({tags: tag}, null, {sort: {_id: -1}});
};
module.exports.getArticleById = async id => {
	if (!validId(id)) return null;

	let article = await BlogPost.findById({
		$gt: id + '0000000000000000',
		$lt: id + 'ffffffffffffffff'
	});

	return article;
};
module.exports.saveArticle = async (tags, password, post, lang, id) => {
	if (post === undefined || tags === undefined || lang === undefined || !validPassword(password)) throw new Error('Wrong password');

	tags = tags === '' ? null : tags.split(', ');

	let article;
	if (id === undefined) { // create a new article
		article = new BlogPost({
			md: post,
			tags,
			lang
		});
	} else { // edit saved article
		if(!validId(id)) throw new Error('Article doesn\'t exist');

		article = await BlogPost.findById({
			$gt: id + '0000000000000000',
			$lt: id + 'ffffffffffffffff'
		});

		if (article === null) throw new Error('Article doesn\'t exist');

		article.tags = tags;
		article.md = post;
		article.lang = lang;
	}

	let renderer = new marked.Renderer(),
		title = null;

	renderer.heading = function (text, level, raw) {
		if (level === 1) {
			if (title === null) title = text;
			else throw new Error('Only one level 1 title allowed');

			return '';
		} else return marked.Renderer.prototype.heading.call(this, text, level, raw);
	};

	article.html = marked(post, {
		gfm: true,
		tables: true,
		breaks: true,
		pedantic: false,
		sanitize: true,
		smartLists: true,
		smartypants: true,
		highlight: (code) => {
			return require('highlight.js').highlightAuto(code).value;
		},
		xhtml: true,
		renderer
	});
	if (title === null) throw new Error('There must be one level 1 title');
	article.title = title;

	await article.save();

	return article._id.toString().slice(0, -16);
};
module.exports.formatTitle = function(title) {
	return title.replace(/\s+/g, '-').toLowerCase();
}
