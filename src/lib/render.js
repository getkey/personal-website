const marked = require('marked');
const markedOptions = Object.assign ({}, marked.defaults, {
	gfm: true,
	tables: true,
	breaks: true,
	pedantic: false,
	smartLists: true,
	smartypants: true,
	highlight: (code) => {
		return require('highlight.js').highlightAuto(code).value;
	},
	xhtml: true,
});

module.exports = function(md) {
	const lexer = new marked.Lexer(markedOptions);
	const tokens = lexer.lex(md);

	const content = parseContent(Object.assign([], tokens)); // parsing consumes the tokens
	const excerpt = parseExcerpt(tokens);

	return {
		content,
		excerpt,
	};
};

function parseContent(tokens) {
	return marked.parser(tokens, markedOptions);
}
function parseExcerpt(tokens) {
	const renderer = new marked.Renderer();
	renderer.link = function(href, title, text) { // strip out links
		return text;
	};
	const options = Object.assign({}, markedOptions, {
		renderer,
	});

	function getSliceIndex(tokens_) { // limit to two paragraphs
		let pAmount = 0;
		for (const [i, token] of tokens_.entries()) {
			if (token.type === 'paragraph') ++pAmount;

			if (pAmount === 2) return i + 1;
		}

		return tokens_.length;
	}

	const links = tokens.links;
	const sliceIndex = getSliceIndex(tokens);
	const slicedTokens = tokens.slice(0, sliceIndex);
	slicedTokens.links = links;

	return marked.parser(slicedTokens, options);
}
