const fs = require('fs');
const path = require('path');
const util = require('util');
const ejs = require('ejs');

const render = require('./lib/render.js');
const { formatTitle, idFromDate } = require('./lib/url.js');
const { baseUrl } = require('./config.js');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const mkdir = util.promisify(fs.mkdir);

const articlesDir = path.join(__dirname, '..', 'articles');
const baseDir = path.join(__dirname, '..', 'public');
const blogDir = path.join(baseDir, 'blog');

const articles = fs.readdirSync(articlesDir)
	.map(dirName => Promise.all([
		readFile(path.join(articlesDir, dirName, 'index.md'), 'utf8'),
		readFile(path.join(articlesDir, dirName, 'metadata.json'), 'utf8').then(metadataStr => {
			const metadata = JSON.parse(metadataStr);
			metadata.date = new Date(metadata.date);
			return metadata;
		}),
	]))
	.map(promise => promise.then(([md, { tags, lang, date }]) => {
		const { content, excerpt, title } = render(md);
		return {
			content,
			excerpt,
			title,
			id: idFromDate(date),
			tags,
			lang,
			date,
			formatedTitle: formatTitle(title),
		};
	}));

// blog articles
articles.forEach(async promise => {
	const { content, title, date, tags, lang, id, formatedTitle } = await promise;
	const articleDir = path.join(blogDir, id);

	const [html] = await Promise.all([
		ejs.renderFile(path.join(__dirname, 'view', 'blog_render.ejs'), {
			title,
			date,
			bodyCopy: content,
			tags,
			lang,
			canonical: `${baseUrl}/blog/${id}/${formatedTitle}`,
		}),
		mkdir(articleDir, { recursive: true }),
	]);

	writeFile(
		path.join(articleDir, `${formatedTitle}.html`),
		html,
	);
});

const sortedArticles = Promise.all(articles).then(articles => ([
	...articles,
].sort((a, b) => b.date - a.date)));
const mkBlogDir = mkdir(blogDir, { recursive: true });

// blog index
sortedArticles.then(async articles => {
	const [html] = await Promise.all([
		ejs.renderFile(path.join(__dirname, 'view', 'blog_index.ejs'), {
			postList: articles,
			canonical: `${baseUrl}/blog`,
		}),
		mkBlogDir,
	]);

	writeFile(
		path.join(blogDir, 'index.html'),
		html,
	);
});

// RSS feed
sortedArticles.then(async articles => {
	const [xml] = await Promise.all([
		ejs.renderFile(path.join(__dirname, 'view', 'atom.ejs'), {
			postList: articles,
		}),
		mkBlogDir,
	]);

	writeFile(
		path.join(blogDir, 'atom.xml'),
		xml,
	);
});

// about
ejs.renderFile(path.join(__dirname, 'view', 'about.ejs'), {
	canonical: `${baseUrl}/about`,
}).then(html => writeFile(
	path.join(baseDir, 'about.html'),
	html,
));

// 404
ejs.renderFile(path.join(__dirname, 'view', '404.ejs')).then(html => writeFile(
	path.join(baseDir, '404.html'),
	html,
));

// home
ejs.renderFile(path.join(__dirname, 'view', 'home.ejs'), {
	canonical: baseUrl,
}).then(html => writeFile(
	path.join(baseDir, 'index.html'),
	html,
));

sortedArticles.then(async articles => {
	const articlesByTag = articles.reduce((acc, article) => {
		article.tags.forEach(tag => {
			if (acc[tag] === undefined) {
				acc[tag] = [article];
			} else {
				acc[tag].push(article);
			}
		});
		return acc;
	}, {});

	const tagDir = path.join(blogDir, 'tag');
	await mkdir(tagDir, { recursive: true });

	Object.entries(articlesByTag).forEach(async ([tag, articles]) => {
		const html = await ejs.renderFile(path.join(__dirname, 'view', 'blog_index.ejs'), {
			postList: articles,
			canonical: `${baseUrl}/blog/tag/${tag}`,
			tag,
		});

		writeFile(
			path.join(tagDir, `${tag}.html`),
			html,
		);
	});
});
