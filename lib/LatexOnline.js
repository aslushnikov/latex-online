var EventEmitter = require('events');
var RequestIdFactory = require('./RequestIdFactory');
var Compilation = require('./Compilation');
var Compiler = require('./Compiler');
var utils = require('./utilities');
var path = require('path');

class LatexOnline extends EventEmitter {
    /**
     * @param {!Storage} storage
     * @param {!DownloadManager} downloadManager
     */
    constructor(storage, downloadManager) {
        super();
        this._storage = storage;
        this._downloadManager = downloadManager;
    }

    /**
     * @param {string} requestId
     * @param {!Downloader} downloader
     * @param {boolean} forceCompilation
     * @return {!Promise<!{>}
     */
    async _runCompilation(requestId, downloader, forceCompilation) {
        this._innerRunCompilation(requestId, downloader, forceCompilation)
            .catch(errorHandler)
            .then(() => downloader.dispose())

        /**
         * @param {!Error} e
         */
        function errorHandler(e) {
            console.error(`ERROR: LatexOnline hit an error during execution - ${e.message}`);
            var result = new LatexOnline.Result(null, null, null);
            this.emit(LatexOnline.Events.CompilationFinished, result);
        }
    }

    /**
     * @param {string} requestId
     * @param {!Downloader} downloader
     * @param {boolean} forceCompilation
     * @return {!Promise<!{>}
     */
    async _innerRunCompilation(requestId, downloader, forceCompilation) {
        if (forceCompilation)
            await this._storage.removeFinishedCompilation(requestId);
        var {compilation, writeToken} = await this._storage.getOrCreateCompilation(requestId);
        console.assert(compilation, 'ERROR: storage.getOrCreateCompilation did not return compilation!');
        if (compilation.finished) {
            var result = new LatexOnline.Result(requestId, compilation, null);
            this.emit(LatexOnline.Events.CompilationFinished, result);
            return;
        }
        if (!writeToken)
            return;

        var {folderPath, target, userError} = await downloader.downloadIfNeeded();
        if (!folderPath) {
            await this._storage.finishCompilation(writeToken, false /* success */);
            var result = new LatexOnline.Result(requestId, null, userError);
            this.emit(LatexOnline.Events.CompilationFinished, result);
            return;
        }
        var timeout = utils.minutes(5);
        var success = await Compiler.run(folderPath, target, compilation.outputPath(), compilation.logPath(), timeout);
        compilation = await this._storage.finishCompilation(writeToken, success);
        var result = new LatexOnline.Result(requestId, compilation, null);
        this.emit(LatexOnline.Events.CompilationFinished, result);
    }

    /**
     * @param {string} url
     * @param {string} branch
     * @param {string} target
     * @param {boolean} forceCompilation
     * @return {!Promise<!LatexOnline.Result>}
     */
    async compileGit(url, target, branch, forceCompilation) {
        var {requestId, userError} = await RequestIdFactory.idForGit(url, branch);
        if (!requestId)
            return new LatexOnline.Result(null, null, userError);
        var downloader = this._downloadManager.createGitDownloader(url, target);
        // Asynchronously start job.
        this._runCompilation(requestId, downloader, forceCompilation);
        return new LatexOnline.Result(requestId, null, null);
    }

    /**
     * @param {string} url
     * @param {boolean} forceCompilation
     * @return {!Promise<!LatexOnline.Result>}
     */
    async compileURL(url, forceCompilation) {
        var downloader = this._downloadManager.createURLDownloader(url);
        var {folderPath, target, userError} = await downloader.downloadIfNeeded();
        if (!folderPath)
            return new LatexOnline.Result(null, null, userError);
        var {requestId, userError} = await RequestIdFactory.idForFile(path.join(folderPath, target));
        if (!requestId) {
            downloader.dispose();
            return new LatexOnline.Result(null, null, userError);
        }
        // Asynchronously start job.
        this._runCompilation(requestId, downloader, forceCompilation);
        return new LatexOnline.Result(requestId, null, null);
    }

    /**
     * @param {string} text
     * @param {boolean} forceCompilation
     * @return {!Promise<!LatexOnline.Result>}
     */
    async compileText(text, forceCompilation) {
        var {requestId} = await RequestIdFactory.idForText(text);
        var downloader = this._downloadManager.createTextDownloader(text);
        // Asynchronously start job.
        this._runCompilation(requestId, downloader, forceCompilation);
        return new LatexOnline.Result(requestId, null, null);
    }

    /**
     * @param {string} tarballPath
     * @param {string} target
     * @param {boolean} forceCompilation
     */
    async compileTarball(tarballPath, target, forceCompilation) {
        var {requestId, userError} = await RequestIdFactory.idForFile(tarballPath);
        if (!requestId)
            return new LatexOnline.Result(null, userError);
        var downloader = this._downloadManager.createTarballExtractor(tarballPath, target);
        // Asynchronously start job.
        this._runCompilation(requestId, downloader, forceCompilation);
        return new LatexOnline.Result(requestId, null, null);
    }
}

LatexOnline.Result = class {
    /**
     * @param {?string} requestId
     * @param {?Compilation} compilation
     * @param {?string} userError
     */
    constructor(requestId, compilation, userError) {
        this.requestId = requestId;
        this.compilation = compilation;
        this.userError = userError;
    }
}

LatexOnline.Events = {
    CompilationFinished: "CompilationFinished"
}

module.exports = LatexOnline;
