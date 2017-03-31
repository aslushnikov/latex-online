var Downloader = require('./lib/Downloader');
var FileSystemStorage = require('./lib/FileSystemStorage');
var LatexOnline = require('./lib/LatexOnline');

// Will be initialized later.
var latex;

// initialize server.
var express = require('express');
var compression = require('compression');
var app = express();
app.use(compression());

app.get('/compile', async (req, res) => {
    var compilation;
    var result;
    try {
        if (req.query.text) {
            result = await latex.compileText(req.query.text);
        } else if (req.query.url) {
            result = await latex.compileURL(req.query.url);
        }
    } catch (e) {
        res.set('Content-Type', 'text/plain');
        res.status(500).send('Exception during handling: ' + e.stack);
        return;
    }
    if (!result || !result.compilation) {
        var statusCode = result && result.userError ? 400 : 500;
        var errorMessage = result ? result.userError : null;
        errorMessage = errorMessage || 'Internal Server Error.';
        res.status(statusCode).send(errorMessage)
        return;
    }
    var compilation = result.compilation;
    if (!!req.query.log || compilation.status === Compilation.Status.Running
            || compilation.status === Compilation.Status.Fail) {
        res.sendFile(compilation.logPath());
        return;
    }
    if (compilation.status === Compilation.Status.Success) {
        res.sendFile(compilation.outputPath());
        return;
    }
    res.status(500).send('Server is panicing. Unexpected behavior!')
});

// Initialize service dependencies.
Promise.all([
    FileSystemStorage.create('/tmp/storage/'),
    Downloader.create('/tmp/downloads/'),
]).then(onInitialized)
.catch(onFailed);

function onInitialized(instances) {
    var storage = instances[0];
    var downloader = instances[1];
    //downloader.disableCleanupForDebugging();

    latex = new LatexOnline(storage, downloader);
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



