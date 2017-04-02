var EventEmitter = require('events');
var RequestIdFactory = require('./RequestIdFactory');
var DownloadManager = require('./DownloadManager');
var FileSystemStorage = require('./FileSystemStorage');
var Compilation = require('./Compilation');
var Compiler = require('./Compiler');
var utils = require('./utilities');
var path = require('path');

class LatexOnline extends EventEmitter {
    /**
     * @param {string} tmpFolder
     * @param {resultsFolder} resultsFolder
     */
    static async create(tmpFolder, resultsFolder) {
        var [downloadManager, storage] = await Promise.all([
            DownloadManager.create(tmpFolder),
            FileSystemStorage.create(resultsFolder),
        ]);
        if (!downloadManager || !storage)
            return null;
        return new LatexOnline(downloadManager, storage);
    }

    /**
     * @param {!DownloadManager} downloadManager
     * @param {!Storage} storage
     */
    constructor(downloadManager, storage) {
        super();
        this._downloadManager = downloadManager;
        this._storage = storage;
        // Re-emit the CompilationFinished event to clients.
        this._storage.on(FileSystemStorage.Events.CompilationFinished, compilation => this.emit(LatexOnline.Events.CompilationFinished, compilation));
    }

    /**
     * @return {!Storage}
     */
    storage() {
        return this._storage;
    }

    /**
     * @param {string} url
     * @param {string} branch
     * @param {string} target
     * @return {!Promise<!LatexOnline.Result>}
     */
    async compileGit(url, target, branch) {
        var {requestId, userError} = await RequestIdFactory.idForGit(url, target, branch);
        if (!requestId)
            return new LatexOnline.Result(null, null, userError);
        var downloader = this._downloadManager.createGitDownloader(url, target);
        var compiler = new Compiler(this._storage, requestId, downloader, this._onCompilationFinished);
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

LatexOnline.Events = {
    CompilationFinished: "CompilationFinished"
};

module.exports = LatexOnline;
