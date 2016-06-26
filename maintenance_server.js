function app(req, res) {
	res.writeHead(200);
	res.end('This website is temporarily offline\n' + process.argv.slice(2).join(' '));
}

var fs = require('fs'),
	options = {
		key: fs.readFileSync(__dirname + '/tls/getkey.eu.key'),
		cert: fs.readFileSync(__dirname + '/tls/getkey.eu.chained.crt')
	},
	server = require('https').createServer(options, app);

server.listen(443);

/*HTTP redirection*/
var http = require('http');
http.createServer(function (req, res) {
	res.writeHead(301, { 'Location': 'https://' + req.headers['host'] + req.url });
	res.end();
}).listen(80);
