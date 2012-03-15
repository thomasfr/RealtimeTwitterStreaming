var util = require('util');
var https = require('https');
var _ = require('underscore');
var hogan = require('./lib/express-hogan');

var express = require('express');
var app = express.createServer();

app.configure(function(){
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(express.static(__dirname + '/public'));
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    app.use(app.router);
    app.set('views', __dirname + '/views');
    app.set('views', 'views');
    app.set('view engine', 'html');
    app.set('view options', {
        "layout":false
    });
    app.register(".html", hogan);
});

var WebSocketServer = require('ws').Server
var wss = new WebSocketServer({server:app});
app.listen(3000);

app.get('/', function(req, res){
  res.render('index');
});

var options = {
	host: 'stream.twitter.com',
	path: '/1/statuses/filter.json',
	port: 443,
    headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "*/*"
    },
	auth: 'user:pass',
	method: 'POST'
}


wss.on('connection', function(ws) {
    ws.on('message', function(message) {
        console.log('received: %s', message);
    });
});

var req = https.request(options);
req.on('response', function(res) {
  res.setEncoding('utf8');
  res.on('data', function (chunk) {
    console.log(util.inspect(JSON.parse(chunk), false, 5, true));
    _.each(wss.clients, function(ws) {
        ws.send('{"tweet":'+chunk+'}',{mask:true});
    })
  });
});

req.on('error', function(e) {
  console.log('problem with request: ' + e.message);
});

req.write('track=FOO\n', 'utf8');
req.end();