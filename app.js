
/**
 * Module dependencies.
 */

var express = require('express')
  , fs = require('fs')
  , get = require('./process.js')

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
    /*
    res.writeHead(200, {'content-type': "application/pdf"});
    fs.createReadStream("tmp/pdf.pdf", {
          'bufferSize': 4 * 1024
    }).pipe(res);
    */
});

app.get('/tex=:url', function(req, res) {
    //res.send(req.params.url);
    console.log(req.params.url);
    get(req.params.url, function(err, data) {
        if (err) {
            res.writeHead(500, {'content-type': 'text/plain'});
            res.write(err);
            res.end();
        } else {
            res.writeHead(200, {'content-type': 'application/pdf'});
            res.write(data);
            res.end();
        }
    });
});

app.listen(2700);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
