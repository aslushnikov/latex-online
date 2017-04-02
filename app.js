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

function sendError(res, userError) {
    res.set('Content-Type', 'text/plain');
    var statusCode = userError ? 400 : 500;
    var error = userError || 'Internal Server Error';
    res.status(statusCode).send(error)
}

async function onCompilationFinished(res, compilation) {
    // Cleanup file uploade.
    if (compilation.userError) {
        sendError(res, compilation ? compilation.userError : null);
    } else if (compilation.success) {
        res.status(200).sendFile(compilation.outputPath());
    } else {
        res.status(400).sendFile(compilation.logPath());
    }
}

app.get('/compile', async (req, res) => {
    var forceCompilation = req.query && !!req.query.force;
    var result;
    if (req.query.text) {
        result = await latex.compileText(req.query.text, forceCompilation);
    } else if (req.query.url) {
        result = await latex.compileURL(req.query.url, forceCompilation);
    } else if (req.query.git) {
        result = await latex.compileGit(req.query.git, req.query.target, 'master', forceCompilation);
    }
    var {compilation, userError} = result;
    if (!compilation) {
        sendError(res, userError);
        return;
    }
    compilation.run().then(() => onCompilationFinished(res, compilation));
});

var multer  = require('multer')
var upload = multer({ dest: '/tmp/file-uploads/' })
app.post('/data', upload.any(), async (req, res) => {
    if (!req.files || req.files.length !== 1) {
        sendError(res, 'ERROR: files are not uploaded to server.');
        return;
    }
    var file = req.files[0];
    var {compilation, userError} = await latex.compileTarball(file.path, req.query.target);
    if (!compilation) {
        sendError(res, userError);
        return;
    }
    compilation.run().then(() => {
        onCompilationFinished(res, compilation);
        utils.unlink(file.path);
    });
});

// Initialize service dependencies.
LatexOnline.create('/tmp/downloads/', '/tmp/storage/')
    .then(onInitialized)

function onInitialized(latexOnline) {
    if (!latexOnline) {
        console.error('ERROR: failed to initialize latexOnline');
        return;
    }
    latex = latexOnline;

    // Initialize janitor to clean up stale storage.
    var expiry = utils.hours(24);
    var cleanupTimeout = utils.minutes(5);
    var janitor = new StorageJanitor(latex, expiry, cleanupTimeout);

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
