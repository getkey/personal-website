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
const outDir = path.join(__dirname, '..', 'public', 'blog');

fs.readdirSync(articlesDir)
	.map(dirName => {
		return Promise.all([
			readFile(path.join(articlesDir, dirName, 'index.md'), 'utf8'),
			readFile(path.join(articlesDir, dirName, 'metadata.json'), 'utf8').then(metadataStr => {
				const metadata = JSON.parse(metadataStr);
				metadata.date = new Date(metadata.date);
				return metadata;
			}),
		]);
	})
	.forEach(promise => promise.then(([md, { tags, lang, date }]) => {
		const { content, excerpt, title } = render(md);
		const id = idFromDate(date);
		const articleDir = path.join(outDir, id);
		const formatedTitle = formatTitle(title);

		return Promise.all([
			ejs.renderFile(path.join(__dirname, 'view', 'blog_render.ejs'), {
				title,
				date,
				bodyCopy: content,
				tags,
				lang,
				canonical: `${baseUrl}/blog/${id}/${formatedTitle}`,
			}),
			mkdir(articleDir, { recursive: true }),
		]).then(([html]) => ({
			articleDir,
			formatedTitle,
			html,
			excerpt,
		}));
	}).then(({ articleDir, html, formatedTitle }) => writeFile(
		path.join(articleDir, `${formatedTitle}.html`),
		html,
	)));
// TODO: something with the excerpt
