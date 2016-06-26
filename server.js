var express = require('express'),
	app = express(),

	server = require('http').Server(app);


server.listen(8080);

app.set('views', __dirname + '/views');
if (process.env.NODE_ENV === 'development') app.use(express.static('static'));


require('./blog.js')(app);

app.get('/search', function (req, res) {
	res.render('search.ejs', {keywords: req.query.q});
})
.get('/about', function (req, res) {
	res.render('about.ejs');
});


/* 404 */
app.use(function (req, res, next) {
	res.render('404.ejs');
})

console.log('The server is up !');
