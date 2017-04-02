var DownloadManager = require('./lib/DownloadManager');
var FileSystemStorage = require('./lib/FileSystemStorage');
var StorageJanitor = require('./lib/StorageJanitor');
var LatexOnline = require('./lib/LatexOnline');
var utils = require('./lib/utilities');

// Will be initialized later.
var latex;

// initialize server.
var express = require('express');
var compression = require('compression');

var app = express();
app.use(compression());

var requestIdToResponses = new Map();

function sendResponse(res, latexResult) {
    // Cleanup file uploade.
    if (res.req_filepath)
        utils.unlink(res.req_filepath);
    var {requestId, compilation, userError} = latexResult;
    console.assert(compilation.finished, 'ERROR: attempt to send response for non-finished compilation!');
    if (!compilation) {
        var statusCode = userError ? 400 : 500;
        var error = userError || 'Internal Server Error';
        res.status(statusCode).send(error)
        return;
    }
    if (compilation.success) {
        res.sendFile(compilation.outputPath());
    } else {
        res.sendFile(compilation.logPath());
    }
}

async function onCompilationFinished(latexResult) {
    var responses = requestIdToResponses.get(latexResult.requestId);
    if (!responses) {
        console.log('no responses! ' + latexResult.requestId);
        return;
    }
    requestIdToResponses.delete(latexResult.requestId);
    for (var res of responses)
        sendResponse(res, latexResult);
}

app.get('/compile', async (req, res) => {
    var result;
    var forceCompile = req.query && !!req.query.force;
    if (req.query.text) {
        result = await latex.compileText(req.query.text, forceCompile);
    } else if (req.query.url) {
        result = await latex.compileURL(req.query.url, forceCompile);
    } else if (req.query.git) {
        result = await latex.compileGit(req.query.git, req.query.target, 'master', forceCompile);
    }
    var requestId = result ? result.requestId : null;
    console.log('r: ' + requestId);
    if (!requestId) {
        sendResponse(res, result);
        return;
    }
    var responsesArray = requestIdToResponses.get(requestId);
    if (!responsesArray) {
        console.log(' -- populating array: ' + requestId);
        responsesArray = [];
        requestIdToResponses.set(requestId, responsesArray);
    }
    responsesArray.push(res);
});

var multer  = require('multer')
var upload = multer({ dest: '/tmp/file-uploads/' })
app.post('/data', upload.any(), async (req, res) => {
    if (!req.files || req.files.length !== 1) {
        res.set('Content-Type', 'text/plain');
        res.status(400).send('Error: files are not uploaded to server.');
        return;
    }
    var result;
    var file = req.files[0];
    result = await latex.compileTarball(file.path, req.query.target, true /* forceCompilation */);
    res.req_filepath = file.path;
    var requestId = result ? result.requestId : null;
    if (!requestId) {
        sendResponse(res, result);
        return;
    }
    var responsesArray = requestIdToResponses.get(requestId);
    if (!responsesArray) {
        responsesArray = [];
        requestIdToResponses.set(requestId, responsesArray);
    }
    responsesArray.push(res);
});

// Initialize service dependencies.
Promise.all([
    FileSystemStorage.create('/tmp/storage/'),
    DownloadManager.create('/tmp/downloads/'),
]).then(onInitialized)
.catch(onFailed);

function onInitialized(instances) {
    var storage = instances[0];
    var downloadManager = instances[1];

    // Initialize janitor to clean up stale storage.
    var expiry = utils.hours(24);
    var cleanupTimeout = utils.minutes(5);
    var janitor = new StorageJanitor(storage, expiry, cleanupTimeout);

    latex = new LatexOnline(storage, downloadManager);
    latex.on(LatexOnline.Events.CompilationFinished, onCompilationFinished);
    var port = process.env.PORT || 2700;
    var listener = app.listen(port, () => {
        console.log("Express server started:");
        console.log("    PORT = " + listener.address().port);
        console.log("    ENV = " + app.settings.env);
    });

    var VERSION = process.env.VERSION || "undef";
    VERSION = VERSION.substr(0, 9);
    console.log("Running version SHA: " + VERSION);
}

function onFailed(err) {
    console.error('ERROR: failed to initialize systems - ' + err);
}



