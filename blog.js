const mongoose = require('mongoose'),
	bcrypt = require('bcrypt'),
	fs = require('fs'),
	render = require('./render.js');

mongoose.Promise = global.Promise;

mongoose.connect('mongodb://localhost/blog');
mongoose.connection.on('error', console.error.bind(console, 'Mongoose: Connection error:'));


let blogPostSchema = new mongoose.Schema({
	title: String,
	md: String,
	tags: [String],
	lang: String,
	cache: {
		content: String,
		excerpt: String,
	}
});

let BlogPost = mongoose.model('BlogPost', blogPostSchema);

async function validPassword(password) {
	if (password === undefined) return false;

	return await bcrypt.compare(password, fs.readFileSync('hash.txt', 'utf-8'));
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
module.exports.saveArticle = async (tags, password, md, lang, id) => {
	if (md === undefined || tags === undefined || lang === undefined || !await validPassword(password)) throw new Error('Wrong password');

	tags = tags === '' ? null : tags.split(', ');

	let article;
	if (id === undefined) { // create a new article
		article = new BlogPost({
			md,
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
		article.md = md;
		article.lang = lang;
	}

	let { title, content, excerpt } = render(md);
	article.cache.content = content;
	article.cache.excerpt = excerpt;
	article.title = title;

	await article.save();

	return article._id.toString().slice(0, -16);
};
module.exports.formatTitle = function(title) {
	return title.replace(/\s+/g, '-').toLowerCase();
};
