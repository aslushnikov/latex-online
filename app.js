var path = require('path');
var LatexOnline = require('./lib/LatexOnline');
var Janitor = require('./lib/Janitor');
var utils = require('./lib/utilities');

var VERSION = process.env.VERSION || "master";
VERSION = VERSION.substr(0, 9);

// Will be initialized later.
var latexOnline;

// Initialize service dependencies.
LatexOnline.create('/tmp/downloads/', '/tmp/storage/')
    .then(onInitialized)

function onInitialized(latex) {
    latexOnline = latex;
    if (!latexOnline) {
        console.error('ERROR: failed to initialize latexOnline');
        return;
    }

    // Initialize janitor to clean up stale storage.
    var expiry = utils.hours(24);
    var cleanupTimeout = utils.minutes(5);
    var janitor = new Janitor(latexOnline, expiry, cleanupTimeout);

    // Launch server.
    var port = process.env.PORT || 2700;
    var listener = app.listen(port, () => {
        console.log("Express server started:");
        console.log("    PORT = " + listener.address().port);
        console.log("    ENV = " + app.settings.env);
        console.log("    SHA = " + VERSION);
    });
}

// Initialize server.
var express = require('express');
var compression = require('compression');
var useragent = require('express-useragent');

var app = express();
app.use(compression());
app.use(useragent.express());
app.use(express.static(__dirname + '/public'));

function sendError(res, userError) {
    res.set('Content-Type', 'text/plain');
    var statusCode = userError ? 400 : 500;
    var error = userError || 'Internal Server Error';
    res.status(statusCode).send(error)
}

async function handleResult(res, latexResult) {
    var {compilation, userError} = latexResult;
    if (!compilation) {
        sendError(res, userError);
        return;
    }
    await compilation.run();
    if (compilation.userError) {
        sendError(res, compilation.userError);
    } else if (compilation.success) {
        res.status(200).sendFile(compilation.outputPath(), {acceptRanges: false});
    } else {
        res.status(400).sendFile(compilation.logPath(), {acceptRanges: false});
    }
}

app.get('/version', (req, res) => {
    res.json({
        version: VERSION,
        link: `http://github.com/aslushnikov/latex-online/commit/${VERSION}`
    });
});

app.get('/pending', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pending.html'));
});

var pendingTrackIds = new Set();
app.get('/compile', async (req, res) => {
    // Do not leak too much memory if clients drop connections on redirect.
    if (pendingTrackIds.size > 10000)
        pendingTrackIds.clear();
    var trackId = req.query.trackId;
    var isBrowser = !req.useragent.isBot;
    // Redirect browser to the page with analytics code.
    if (isBrowser && (!trackId || !pendingTrackIds.has(trackId))) {
        trackId = Date.now() + '';
        pendingTrackIds.add(trackId);
        var query = Object.assign({}, req.query);
        query.trackId = trackId;

        var search = Object.keys(query).map(key => `${key}=${encodeURIComponent(query[key])}`).join('&');
        res.redirect(307, `/pending?${search}`);
        return;
    }
    pendingTrackIds.delete(trackId);

    var forceCompilation = req.query && !!req.query.force;
    var result;
    if (req.query.text) {
        result = await latexOnline.compileText(req.query.text, forceCompilation);
    } else if (req.query.url) {
        result = await latexOnline.compileURL(req.query.url, forceCompilation);
    } else if (req.query.git) {
        result = await latexOnline.compileGit(req.query.git, req.query.target, 'master', forceCompilation);
    }
    if (result)
        handleResult(res, result);
    else
        sendError(res, 'ERROR: failed to parse request: ' + JSON.stringify(req.query));
});

var multer  = require('multer')
var upload = multer({ dest: '/tmp/file-uploads/' })
app.post('/data', upload.any(), async (req, res) => {
    if (!req.files || req.files.length !== 1) {
        sendError(res, 'ERROR: files are not uploaded to server.');
        return;
    }
    var file = req.files[0];
    var latexResult = await latexOnline.compileTarball(file.path, req.query.target, true);
    if (latexResult.compilation)
        latexResult.compilation.run().then(() => utils.unlink(file.path));
    else
        utils.unlink(file.path);
    handleResult(res, latexResult);
});
