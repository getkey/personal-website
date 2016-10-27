const mongoose = require('mongoose'),
	marked = require('marked'),
	bcrypt = require('bcrypt'),
	fs = require('fs');

mongoose.Promise = global.Promise;
let renderer = new marked.Renderer();
marked.setOptions({
	renderer: renderer,
	gfm: true,
	tables: true,
	breaks: true,
	pedantic: false,
	sanitize: true,
	smartLists: true,
	smartypants: true,
	highlight: function (code) {
		return require('highlight.js').highlightAuto(code).value;
	}
});

mongoose.connect('mongodb://localhost/blog');
mongoose.connection.on('error', console.error.bind(console, 'Mongoose: Connection error:'));


let blogPostSchema = new mongoose.Schema({
	html: String,
	md: String,
	tags: [String],
	lang: String
});

let BlogPost = mongoose.model('BlogPost', blogPostSchema);

function insertDate(html, date) {
	let dayArray = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
		monthArray = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'December'],
		addAt = html.indexOf('</h1>') + '</h1>'.length,
		tmpDateStr = '\n<time datetime="' + date.toISOString() + '" pubdate>' + dayArray[date.getUTCDay()] + ' ' + date.getUTCDate() + ' ' + monthArray[date.getUTCMonth()] + ' ' + date.getUTCFullYear() + '</time>\n';

	return html.substr(0, addAt) + tmpDateStr + html.substr(addAt);
}

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

module.exports.getArticlesByTag = async (tag) => {
	return await BlogPost.find({tags: tag}, null, {sort: {_id: -1}});
};
module.exports.getArticleById = async (id) => {
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
	article.html = insertDate(marked(post), article._id.getTimestamp());

	await article.save();

	return article._id.toString().slice(0, -16);
};
