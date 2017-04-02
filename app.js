var DownloadManager = require('./lib/DownloadManager');
var FileSystemStorage = require('./lib/FileSystemStorage');
var StorageJanitor = require('./lib/StorageJanitor');
var LatexOnline = require('./lib/LatexOnline');
var Compiler = require('./lib/Compiler');
var utils = require('./lib/utilities');

// Will be initialized later.
var latex;

// initialize server.
var express = require('express');
var compression = require('compression');

var app = express();
app.use(compression());

var requestIdToResponses = new Map();

function sendError(res, userError) {
    var statusCode = userError ? 400 : 500;
    var error = userError || 'Internal Server Error';
    res.status(statusCode).send(error)
}

function sendResponse(res, compilation) {
    // Cleanup file uploade.
    if (res.req_filepath)
        utils.unlink(res.req_filepath);
    console.assert(compilation.finished, 'ERROR: attempt to send response for non-finished compilation!');
    if (!compilation || compilation.userError) {
        sendError(res, compilation ? compilation.userError : null);
        return;
    } else if (compilation.success) {
        res.sendFile(compilation.outputPath());
    } else {
        res.sendFile(compilation.logPath());
    }
}

async function onCompilationFinished(requestId, compilation) {
    var responses = requestIdToResponses.get(requestId);
    if (!responses)
        return;
    requestIdToResponses.delete(requestId);
    for (var res of responses)
        sendResponse(res, compilation);
}

app.get('/compile', async (req, res) => {
    var result;
    if (req.query.text) {
        result = await latex.compileText(req.query.text);
    } else if (req.query.url) {
        result = await latex.compileURL(req.query.url);
    } else if (req.query.git) {
        result = await latex.compileGit(req.query.git, req.query.target, 'master');
    }
    var {compiler, requestId, userError} = result;
    if (!compiler) {
        sendError(res, userError);
        return;
    }
    var responsesArray = requestIdToResponses.get(requestId);
    if (!responsesArray) {
        responsesArray = [];
        requestIdToResponses.set(requestId, responsesArray);
    }
    responsesArray.push(res);
    compiler.once(Compiler.Events.Finished, onCompilationFinished);
    var forceCompile = req.query && !!req.query.force;
    compiler.run(forceCompile);
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
    var {compiler, requestId, userError} = result;
    if (!compiler) {
        sendError(res, userError);
        return;
    }
    var responsesArray = requestIdToResponses.get(requestId);
    if (!responsesArray) {
        responsesArray = [];
        requestIdToResponses.set(requestId, responsesArray);
    }
    responsesArray.push(res);
    compiler.once(Compiler.Events.Finished, onCompilationFinished);
    var forceCompile = req.query && !!req.query.force;
    compiler.run(forceCompile);
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



