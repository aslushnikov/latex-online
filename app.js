
/**
 * Module dependencies.
 */

var express = require('express')
  , fs = require('fs')
  // pass false to disable use of memcached
  , Processor = require('./process.js').RequestProcessor
  , GoogleAnalytics = require('ga')

var app = module.exports = express.createServer();

var ga = new GoogleAnalytics('UA-31467918-1', 'latex.aslushnikov.com');
var excludeTrack = [/^\/$/, /^\/favicon/, /^\/stylesheets/];
//ga.trackPage('testing/1');

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(function(req, res, next){
    var exclude = false;
    for(var i = 0; i < excludeTrack.length; i++) {
      exclude = exclude || excludeTrack[i].test(req.url);
    }
    if (!exclude)  {
      ga.trackPage(req.url);
      console.log("Google Analytics track " + req.url);
    }
    next();
  });
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

function success(req, res, next) {
    if (req.latexOnline.err) {
        res.writeHead(400, {'content-type': 'text/plain'});
        res.write(req.latexOnline.err.toString());
        res.end();
    } else {
        var headers = {
            'content-type': 'application/pdf',
            'content-length': req.latexOnline.data.length
        };
        if (req.query['download']) {
            headers['content-disposition'] = 'attachment; filename="' + req.query['download']+ '"';
        }
        res.writeHead(200, headers);
        res.write(req.latexOnline.data);
        res.end();
    }
}

function computeCompilation(req, res, next) {
    var opts = {
        entity: req.query['git'] || req.query['url'],
        target: req.query['target'],
        disableCaching: !!req.query['force'],
    }
    var types = ["git", "url"];
    for(var i = 0; i < types.length; i++) {
        if (req.query[types[i]]) {
            opts.type = types[i];
        }
    }
    new Processor(opts, function(err, data) {
        req.latexOnline = {err: err, data: data};
        next();
    });
}

function checkUtilityCompatability(req, res, next) {
    if (!req.query['target']) {
        res.writeHead(412, {'content-type': 'text/plain'});
        res.write("You're using old remote-compile.sh tool\n");
        res.write("Upgrade at https://github.com/aslushnikov/latex-online");
        res.end();
        return;
    }
    next();
}

app.get('/compile', computeCompilation, success);

app.post('/data', checkUtilityCompatability, function(req, res, next) {
    function callback(err, data) {
        req.latexOnline = {err: err, data:data};
        next();
    };
    new Processor({
        type: "file",
        entity: req.files['file'].path,
        target: req.query['target'],
        disableCaching: !!req.query['force'],
    }, callback);
}, success);

app.listen(2700);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
