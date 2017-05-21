const marked = require('marked'),
	markedOptions = Object.assign ({}, marked.defaults, {
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
		xhtml: true
	});

module.exports = function(md) {
	let lexer = new marked.Lexer(markedOptions),
		tokens = lexer.lex(md);

	validate(tokens);
	let title = extractTitle(tokens),
		content = parseContent(Object.assign([], tokens)), // parsing consumes the tokens
		excerpt = parseExcerpt(tokens);

	return {
		content,
		excerpt,
		title
	};
}

function validate(tokens) {
	if (tokens[0].type !== 'heading' || tokens[0].depth !== 1) throw new Error('The article needs to start with a level 1 title');

	let h1Amount = 0;
	for (let token of tokens) {
		if (token.type === 'heading' && token.depth === 1) ++h1Amount;
	}
	if (h1Amount !== 1) throw new Error('There must be exactly one level 1 title');
}
function extractTitle(tokens) {
	token = tokens.shift();
	return marked.inlineLexer(token.text, tokens.links, markedOptions);
}
function parseContent(tokens) {
	return marked.parser(tokens, markedOptions);
}
function parseExcerpt(tokens) {
	let renderer = new marked.Renderer();
	renderer.link = function(href, title, text) { // strip out links
		return text;
	}
	let options = Object.assign({}, markedOptions, {
		renderer
	});

	function getSliceIndex(tokens) { // limit to two paragraphs
		let pAmount = 0;
		for (let [i, token] of tokens.entries()) {
			if (token.type === 'paragraph') ++pAmount;

			if (pAmount === 2) return i + 1;
		}

		return tokens.length;
	}

	let links = tokens.links;
		sliceIndex = getSliceIndex(tokens);

	slicedTokens = tokens.slice(0, sliceIndex);
	slicedTokens.links = links;

	return marked.parser(slicedTokens, options);
}
