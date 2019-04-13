const mongoose = require('mongoose'),
	auth = require('./auth.js'),
	render = require('./render.js');

const dbUrl = process.env.DB_URL !== undefined ? process.env.DB_URL : 'mongodb://localhost/blog';

function connectDb() {
	mongoose.connect(dbUrl).catch((...err) => {
		const delay = 2000;
		console.error('Mongoose: Connection error:', ...err);
		console.error('Retrying in ' + delay/1000 + 'sec.');
		setTimeout(connectDb, delay);
	});
}
connectDb();

let blogPostSchema = new mongoose.Schema({
	md: String,
	tags: [String],
	lang: String,
	date: {
		type: Date,
		unique: true,
	},
	cache: { // stuff that can be computed based on the data
		id: {
			type: String,
			unique: true,
		},
		title: String,
		content: String,
		excerpt: String,
	},
});

let BlogPost = mongoose.model('BlogPost', blogPostSchema);

async function validPassword(password) {
	if (password === undefined) return false;

	return await auth.valid(password);
}
function validId(id) {
	return /[\da-f]{8}/.test(id);
}
function idFromDate(date) {
	return Math.floor(date.getTime() / 1000).toString(16);
}

module.exports.close = async () => {
	await mongoose.connection.close();
};
module.exports.getArticles = async tag => {
	const query = tag === undefined ? {} : {tags: tag};

	return await BlogPost.find(query, null, {sort: {date: -1}});
};
async function getArticleById(id) {
	if (!validId(id)) return null;

	return await BlogPost.findOne({
		'cache.id': id,
	});
}
module.exports.getArticleById = getArticleById;

module.exports.saveArticle = async (tags, password, md, lang, id) => {
	if (md === undefined || tags === undefined || lang === undefined || !await validPassword(password)) throw new Error('Wrong password');

	tags = tags === '' ? null : tags.split(', ');

	let article;
	if (id === undefined) { // create a new article
		article = new BlogPost({
			md,
			tags,
			lang,
			date: new Date(),
		});
	} else { // edit saved article
		article = await getArticleById(id);

		if (article === null) throw new Error('Article doesn\'t exist');

		article.tags = tags;
		article.md = md;
		article.lang = lang;
	}

	generateCache(article);


	await article.save();

	return article;
};
function generateCache(article) {
	let { title, content, excerpt } = render(article.md);

	article.cache = {
		title,
		content,
		excerpt,
		id: idFromDate(article.date),
	};
}
module.exports.regenerateCache = async () => {
	const articles = await BlogPost.find();

	for (let article of articles) {
		generateCache(article);
		await article.save();

		console.log('saved:', article.cache.title);
	}
};
module.exports.formatTitle = title => {
	return title
		.replace(/[^a-zA-Z\d\s’']/, '')
		.replace(/[\s’']+/g, '-')
		.toLowerCase();
};
