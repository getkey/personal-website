const fs = require('fs');
const path = require('path');
const util = require('util');
const ejs = require('ejs');

const render = require('./lib/render.js');
const { formatTitle, idFromDate } = require('./lib/url.js');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const mkdir = util.promisify(fs.mkdir);

const articlesDir = path.join(__dirname, '..', 'articles');
const outDir = path.join(__dirname, '..', 'public', 'blog');

fs.readdirSync(articlesDir)
	.filter(filename => filename.endsWith('.md'))
	.map(filename => {
		const base = filename.replace(/\.md$/, '');

		return Promise.all([
			readFile(path.join(articlesDir, `${base}.md`), 'utf8'),
			readFile(path.join(articlesDir, `${base}.json`), 'utf8').then(metadataStr => {
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

		return Promise.all([
			ejs.renderFile(path.join(__dirname, 'view', 'blog_render.ejs'), {
				title,
				date,
				bodyCopy: content,
				tags,
				lang,
				canonical: 'whatever',
			}),
			mkdir(articleDir, { recursive: true }),
		]).then(([html]) => ({
			articleDir,
			title,
			html,
			excerpt,
		}));
	}).then(({ articleDir, html, title }) => {
		const formatedTitle = formatTitle(title);
		return writeFile(path.join(articleDir, `${formatedTitle}.html`), html);
	}));
// TODO: something with the excerpt
