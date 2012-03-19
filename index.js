var util = require('util');
var https = require('https');
var _ = require('underscore');
var hiredis = require('hiredis');
var redis = require('redis');

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
    app.set('view options', {
        "layout":false
    });
});

var WebSocketServer = require('ws').Server
var wss = new WebSocketServer({server:app});
app.listen(3000);

app.get('/', function(req, res){
});

wss.on('connection', function(ws) {
    console.log('New Websocket connection');
})

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

function parseEntities(entities, text, callback) {
    var replace;
    _.each(entities, function(links, key) {
        console.log(key, links);
        if(key === "urls") {
            _.each(links, function(value) {
                text = text.substring(0, value.indices[0]) + 
                ' <a href="'+value.url+'" target="_blank">'+value.url+'</a> ' +
                text.substring(value.indices[1]);
            });
        }
    });
    callback(null, text);
}

function sendTweet(ws, tweet) {
     ws.send('{"tweet":'+JSON.stringify(tweet)+'}', {mask: true});
}

var req = https.request(options);
req.on('response', function(res) {
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
        try {
            var rawTweet = JSON.parse(chunk);
        }
        catch(e) {
            console.error(e);
        }
        if(rawTweet) {
            var tweet;
            //console.log(util.inspect(rawTweet, false, 4, true));
            _.each(wss.clients, function(ws) {
                if (rawTweet.entities) {
                    parseEntities(rawTweet.entities, rawTweet.text, function(err, text) {
                        tweet = {
                            user: rawTweet.user,
                            text: text,
                            id: rawTweet.id
                        }
                        sendTweet(ws, tweet);
                    });
                }
                else {
                    tweet = {
                        user: rawTweet.user,
                        id: rawTweet.id,
                        text: rawTweet.text
                    }
                    sendTweet(ws, tweet);
                }
            });
        }
    });
});

req.on('error', function(e) {
  console.log('problem with request: ' + e.message);
});

req.write('track=html\n', 'utf8');
req.end();
