var RequestIdFactory = require('./RequestIdFactory');
var Compilation = require('./Compilation');
var Compiler = require('./Compiler');
var utils = require('./utilities');
var path = require('path');

class LatexOnline {
    constructor(storage, downloadManager) {
        this._storage = storage;
        this._downloadManager = downloadManager;
    }

    /**
     * @param {string} url
     * @param {string} branch
     * @param {string} target
     * @return {!Promise<!LatexOnline.Result>}
     */
    async compileGit(url, target, branch) {
        var {requestId, userError} = await RequestIdFactory.idForGit(url, branch);
        if (!requestId)
            return new LatexOnline.Result(null, null, userError);
        var downloader = this._downloadManager.createGitDownloader(url, target);
        var compiler = new Compiler(this._storage, requestId, downloader);
        return new LatexOnline.Result(requestId, compiler, null);
    }

    /**
     * @param {string} url
     * @return {!Promise<!LatexOnline.Result>}
     */
    async compileURL(url) {
        var downloader = this._downloadManager.createURLDownloader(url);
        var {folderPath, target, userError} = await downloader.downloadIfNeeded();
        if (!folderPath)
            return new LatexOnline.Result(null, null, userError);
        var {requestId, userError} = await RequestIdFactory.idForFile(path.join(folderPath, target));
        if (!requestId) {
            downloader.dispose();
            return new LatexOnline.Result(null, null, userError);
        }
        var compiler = new Compiler(this._storage, requestId, downloader);
        return new LatexOnline.Result(requestId, compiler, null);
    }

    /**
     * @param {string} text
     * @return {!Promise<!LatexOnline.Result>}
     */
    async compileText(text) {
        var {requestId} = await RequestIdFactory.idForText(text);
        var downloader = this._downloadManager.createTextDownloader(text);
        // Asynchronously start job.
        var compiler = new Compiler(this._storage, requestId, downloader);
        return new LatexOnline.Result(requestId, compiler, null);
    }

    /**
     * @param {string} tarballPath
     * @param {string} target
     * @return {!Promise<!LatexOnline.Result>}
     */
    async compileTarball(tarballPath, target) {
        var {requestId, userError} = await RequestIdFactory.idForFile(tarballPath);
        if (!requestId)
            return new LatexOnline.Result(null, null, userError);
        var downloader = this._downloadManager.createTarballExtractor(tarballPath, target);
        var compiler = new Compiler(this._storage, requestId, downloader);
        return new LatexOnline.Result(requestId, compiler, null);
    }
}

LatexOnline.Result = class {
    /**
     * @param {string} requestId
     * @param {?Compiler} compiler
     * @param {?string} userError
     */
    constructor(requestId, compiler, userError) {
        this.requestId = requestId;
        this.compiler = compiler;
        this.userError = userError;
    }
}

module.exports = LatexOnline;
