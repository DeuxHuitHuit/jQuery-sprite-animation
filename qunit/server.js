// really simple node http server
// from http://ariya.ofilabs.com/2012/03/phantomjs-and-travis-ci.html
// copied from https://github.com/Modernizr/Modernizr/blob/master/test/js/server.js
var connect = require('connect'),
	args = process.argv.slice(2),
	folder = args[0] || '/../../',
	port = args[1] || '80';	

var server = connect.createServer(
    connect.static(__dirname + folder)
).listen(port, '127.0.0.1');

console.log("Test server started on port %s in %s", port, __dirname + folder);