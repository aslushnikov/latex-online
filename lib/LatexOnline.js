var EventEmitter = require('events');
var RequestIdFactory = require('./RequestIdFactory');
var DownloadManager = require('./DownloadManager');
var Compilation = require('./Compilation');
var utils = require('./utilities');
var path = require('path');

class LatexOnline extends EventEmitter {
    /**
     * @param {string} tmpFolder
     * @param {string} resultsFolder
     */
    static async create(tmpFolder, resultsFolder) {
        var [downloadManager, resultsFolderSuccess] = await Promise.all([
            DownloadManager.create(tmpFolder),
            utils.recreateFolderIfNonEmpty(resultsFolder),
        ]);
        if (!downloadManager || !resultsFolderSuccess)
            return null;
        return new LatexOnline(downloadManager, resultsFolder);
    }

    /**
     * @param {!DownloadManager} downloadManager
     * @param {string} resultsFolder
     */
    constructor(downloadManager, resultsFolder) {
        super();
        this._downloadManager = downloadManager;
        this._resultsFolder = resultsFolder;
        /** @type {!Map<string, !Compilation>} */
        this._requestIdToCompilation = new Map();
    }

    /**
     * @param {string} requestId
     * @param {!Downloader} downloader
     * @param {boolean} forceCreate
     * @return {!Compilation}
     */
    _getOrCreateCompilation(requestId, downloader, forceCreate) {
        if (forceCreate)
            this.removeCompilation(requestId);
        var compilation = this._requestIdToCompilation.get(requestId);
        if (compilation) {
            compilation.accessTime = Date.now();
        } else {
            compilation = new Compilation(requestId, downloader, this._resultsFolder);
            this._requestIdToCompilation.set(requestId, compilation);
        }
        return compilation;
    }

    /**
     * @return {!Array<!Compilation>}
     */
    compilations() {
        return Array.from(this._requestIdToCompilation.values());
    }

    /**
     * @return {!Array<!Compilation>}
     */
    removeCompilation(requestId) {
        var compilation = this._requestIdToCompilation.get(requestId);
        if (compilation && compilation.finished) {
            compilation.dispose();
            this._requestIdToCompilation.delete(compilation.requestId);
        }
    }

    /**
     * @param {string} url
     * @param {string} branch
     * @param {string} target
     * @param {boolean} forceCompilation
     * @return {!Promise<!LatexOnline.Result>}
     */
    async compileGit(url, target, branch, forceCompilation) {
        var {requestId, userError} = await RequestIdFactory.idForGit(url, target, branch);
        if (!requestId)
            return new LatexOnline.Result(null, userError);
        var downloader = this._downloadManager.createGitDownloader(url, target);
        var compilation = this._getOrCreateCompilation(requestId, downloader, forceCompilation);
        return new LatexOnline.Result(compilation, null);
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
            return new LatexOnline.Result(null, userError);
        var {requestId, userError} = await RequestIdFactory.idForFile(path.join(folderPath, target));
        if (!requestId) {
            downloader.dispose();
            return new LatexOnline.Result(null, userError);
        }
        var compilation = this._getOrCreateCompilation(requestId, downloader, forceCompilation);
        return new LatexOnline.Result(compilation, null);
    }

    /**
     * @param {string} text
     * @param {boolean} forceCompilation
     * @return {!Promise<!LatexOnline.Result>}
     */
    async compileText(text, forceCompilation) {
        var {requestId} = await RequestIdFactory.idForText(text);
        var downloader = this._downloadManager.createTextDownloader(text);
        var compilation = this._getOrCreateCompilation(requestId, downloader, forceCompilation);
        return new LatexOnline.Result(compilation, null);
    }

    /**
     * @param {string} tarballPath
     * @param {string} target
     * @param {boolean} forceCompilation
     * @return {!Promise<!LatexOnline.Result>}
     */
    async compileTarball(tarballPath, target, forceCompilation) {
        var {requestId, userError} = await RequestIdFactory.idForFile(tarballPath);
        if (!requestId)
            return new LatexOnline.Result(null, userError);
        var downloader = this._downloadManager.createTarballExtractor(tarballPath, target);
        var compilation = this._getOrCreateCompilation(requestId, downloader, forceCompilation);
        return new LatexOnline.Result(compilation, null);
    }
}

LatexOnline.Result = class {
    /**
     * @param {string} requestId
     * @param {?Compiler} compiler
     * @param {?string} userError
     */
    constructor(compilation, userError) {
        this.compilation = compilation;
        this.userError = userError;
    }
}

module.exports = LatexOnline;
