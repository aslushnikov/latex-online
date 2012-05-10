
/**
 * Module dependencies.
 */

var express = require('express')
  , fs = require('fs')
  // pass false to disable use of memcached
  , processor = require('./process.js')

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());

  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', function(req, res) {
    res.render('index.jade');
});

app.get('/compile', function(req, res) {
    processor.processUrl(req.query['url'], function(err, data) {
        if (err) {
            res.writeHead(500, {'content-type': 'text/plain'});
            res.write(err.toString());
            res.end();
        } else {
            res.writeHead(200, {
                'content-type': 'application/pdf',
                'content-length': data.length
            });
            res.write(data);
            res.end();
        }
    });
});

app.post('/data', function(req, res) {
     // connect-form adds the req.form object
  // we can (optionally) define onComplete, passing
  // the exception (if any) fields parsed, and files parsed
    processor.processFile(req.files['file'].path, function(err, data) {
        if (err) {
            res.writeHead(500, {'content-type': 'text/plain'});
            res.write(err.toString());
            res.end();
        } else {
            res.writeHead(200, {
                'content-type': 'application/pdf',
                'content-length': data.length
            });
            res.write(data);
            res.end();
        }
    });
});


app.listen(2700);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
