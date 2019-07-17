const fs = require('fs');
const path = require('path');
const util = require('util');
const ejs = require('ejs');

const render = require('./lib/render.js');
const { formatTitle, idFromDate } = require('./lib/url.js');
const { baseUrl } = require('./config.js');
const redirects = require('./redirects.json');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const mkdir = util.promisify(fs.mkdir);
const readdir = util.promisify(fs.readdir);
const copyFile = util.promisify(fs.copyFile);

const articlesDir = path.join(__dirname, '..', 'articles');
const baseDir = path.join(__dirname, '..', 'public');
const blogDir = path.join(baseDir, 'blog');

const whenArticlesParsed = fs.readdirSync(articlesDir)
	.map(dirName => Promise.all([
		readFile(path.join(articlesDir, dirName, 'index.md'), 'utf8'),
		readFile(path.join(articlesDir, dirName, 'metadata.json'), 'utf8').then(metadataStr => {
			const metadata = JSON.parse(metadataStr);
			metadata.date = new Date(metadata.date);
			return metadata;
		}),
		Promise.resolve(dirName),
	]))
	.map(async promise => {
		const [md, { tags, lang, date }, dirName] = await promise;
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
			inputDir: dirName,
		};
	});

// blog articles
whenArticlesParsed.forEach(async promise => {
	const { content, title, date, tags, lang, id, formatedTitle, inputDir } = await promise;
	const outputDir = path.join(blogDir, id);

	const [html] = await Promise.all([
		ejs.renderFile(path.join(__dirname, 'templates', 'blog_render.ejs'), {
			title,
			date,
			bodyCopy: content,
			tags,
			lang,
			canonical: `${baseUrl}/blog/${id}/${formatedTitle}`,
		}),
		mkdir(outputDir, { recursive: true }),
	]);

	writeFile(
		path.join(outputDir, `${formatedTitle}.html`),
		html,
	);

	// copy assets (images, etc)
	const articleInputDir = path.join(articlesDir, inputDir);
	const allFiles = await readdir(articleInputDir);

	allFiles
		.filter(filename => !['index.md', 'metadata.json'].includes(filename))
		.map(filename => copyFile(
			path.join(articleInputDir, filename),
			path.join(outputDir, filename),
		));
});

const sortedArticles = Promise.all(whenArticlesParsed).then(articles => ([
	...articles,
].sort((a, b) => b.date - a.date)));
const mkBlogDir = mkdir(blogDir, { recursive: true });

// blog index
sortedArticles.then(async articles => {
	const [html] = await Promise.all([
		ejs.renderFile(path.join(__dirname, 'templates', 'blog_index.ejs'), {
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
		ejs.renderFile(path.join(__dirname, 'templates', 'atom.ejs'), {
			postList: articles,
		}),
		mkBlogDir,
	]);

	writeFile(
		path.join(blogDir, 'atom.xml'),
		xml,
	);
});

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
		const html = await ejs.renderFile(path.join(__dirname, 'templates', 'blog_index.ejs'), {
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

// about
ejs.renderFile(path.join(__dirname, 'templates', 'about.ejs'), {
	canonical: `${baseUrl}/about`,
}).then(html => writeFile(
	path.join(baseDir, 'about.html'),
	html,
));

// 404
ejs.renderFile(path.join(__dirname, 'templates', '404.ejs')).then(html => writeFile(
	path.join(baseDir, '404.html'),
	html,
));

// home
ejs.renderFile(path.join(__dirname, 'templates', 'home.ejs'), {
	canonical: baseUrl,
}).then(html => writeFile(
	path.join(baseDir, 'index.html'),
	html,
));

// redirects
Object.entries(redirects).map(async ([from, to]) => {
	const parsed = from.split('/').filter(subs => subs !== '');
	const basename = parsed.slice(0, -1);
	const filename = parsed.slice(-1)[0];

	const [html] = await Promise.all([
		ejs.renderFile(path.join(__dirname, 'templates', 'redirect.ejs'), {
			to,
		}),
		mkdir(path.join(baseDir, ...basename), { recursive: true }),
	]);

	const outputPathComponents = [
		...basename,
		`${filename}.html`,
	];
	const escapedOutputPathComponents = outputPathComponents.map(pathComponent => encodeURIComponent(pathComponent));

	writeFile(
		path.join(baseDir, ...outputPathComponents),
		html,
	);
	writeFile(
		path.join(baseDir, ...escapedOutputPathComponents),
		html,
	);
});
