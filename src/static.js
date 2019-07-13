const fs = require('fs');
const path = require('path');
const util = require('util');
const ejs = require('ejs');

const render = require('./lib/render.js');
const { formatTitle } = require('./lib/url.js');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const mkdir = util.promisify(fs.mkdir);

const articlesDir = path.join(__dirname, '..', 'articles');
const outDir = path.join(__dirname, '..', 'public');

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
		const formatedTitle = formatTitle(title);
		const articleDir = path.join(outDir, formatedTitle);

		return Promise.all([
			ejs.renderFile(path.join(__dirname, 'view', 'blog_render.ejs'), {
				title,
				date,
				bodyCopy: content,
				tags,
				lang,
				canonical: 'whatever',
			}),
			mkdir(articleDir),
		]).then(([html]) => ({
			articleDir,
			html,
			excerpt,
		}));
	}).then(({ articleDir, html }) => writeFile(path.join(articleDir, 'index.html'), html)));
// TODO: something with the excerpt
