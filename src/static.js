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
	.map(filename => readFile(path.join(articlesDir, filename), 'utf8'))
	.forEach(readPromise => readPromise.then(md => {
		const { content, excerpt, title } = render(md);
		const formatedTitle = formatTitle(title);
		const articleDir = path.join(outDir, formatedTitle);

		return Promise.all([
			ejs.renderFile(path.join(__dirname, 'view', 'blog_render.ejs'), {
				title,
				date: new Date(),
				bodyCopy: content,
				tags: [],
				lang: 'en',
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
