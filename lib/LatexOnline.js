var EventEmitter = require('events');
var CompilationRequest = require('./CompilationRequest');
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
        this._fingerprintToCompilation = new Map();
    }

    /**
     * @return {string}
     */
    resultsFolderPath() {
        return this._resultsFolder;
    }

    /**
     * @return {string}
     */
    tmpFolderPath() {
        return this._downloadManager.folderPath();
    }

    /**
     * @param {!CompilationRequest} request
     * @param {!Downloader} downloader
     * @param {boolean} forceCreate
     * @return {!Compilation}
     */
    getOrCreateCompilation(request, downloader) {
        var compilation = this._fingerprintToCompilation.get(request.fingerprint);
        if (compilation) {
            compilation.accessTime = Date.now();
        } else {
            compilation = new Compilation(request, downloader, this._resultsFolder);
            this._fingerprintToCompilation.set(request.fingerprint, compilation);
        }
        return compilation;
    }

    /**
     * @param {string} fingerprint
     * @return {?Compilation}
     */
    compilationWithFingerprint(fingerprint) {
        return this._fingerprintToCompilation.get(fingerprint) || null;
    }

    /**
     * @return {!Array<!Compilation>}
     */
    compilations() {
        return Array.from(this._fingerprintToCompilation.values());
    }

    /**
     * @param {?Compilation} compilation
     */
    removeCompilation(compilation) {
        if (compilation && compilation.finished) {
            compilation.dispose();
            this._fingerprintToCompilation.delete(compilation.fingerprint);
        }
    }

    /**
     * @param {string} url
     * @param {string} branch
     * @param {string} target
     * @param {string} command
     * @param {string} workdir
     * @return {!Promise<!LatexOnline.Result>}
     */
    async prepareGitCompilation(url, target, branch, command, workdir) {
        var {request, userError} = await CompilationRequest.createGitRequest(url, target, branch, command, workdir);
        if (!request)
            return new LatexOnline.Result(null, null, userError);
        var downloader = this._downloadManager.createGitDownloader(url);
        return new LatexOnline.Result(request, downloader, null);
    }

    /**
     * @param {string} url
     * @param {string} command
     * @return {!Promise<!LatexOnline.Result>}
     */
    async prepareURLCompilation(url, command) {
        var fileName = 'main.tex';
        var downloader = this._downloadManager.createURLDownloader(url, fileName);
        var {folderPath, userError} = await downloader.downloadIfNeeded();
        if (!folderPath)
            return new LatexOnline.Result(null, null, userError);
        var {request, userError} = await CompilationRequest.createFileRequest(path.join(folderPath, fileName), fileName, command);
        if (!request) {
            downloader.dispose();
            return new LatexOnline.Result(null, null, userError);
        }
        return new LatexOnline.Result(request, downloader, null);
    }

    /**
     * @param {string} text
     * @param {string} command
     * @return {!Promise<!LatexOnline.Result>}
     */
    async prepareTextCompilation(text, command) {
        var {request, userError} = await CompilationRequest.createForText(text, command);
        if (!request)
            return new LatexOnline.Result(null, null, userError);
        var downloader = this._downloadManager.createTextDownloader(text, request.target);
        return new LatexOnline.Result(request, downloader, null);
    }

    /**
     * @param {string} tarballPath
     * @param {string} target
     * @param {string} command
     * @return {!Promise<!LatexOnline.Result>}
     */
    async prepareTarballCompilation(tarballPath, target, command) {
        var {request, userError} = await CompilationRequest.createFileRequest(tarballPath, target, command);
        if (!request)
            return new LatexOnline.Result(null, null, userError);
        var downloader = this._downloadManager.createTarballExtractor(tarballPath);
        return new LatexOnline.Result(request, downloader, null);
    }
}

LatexOnline.Result = class {
    /**
     * @param {?CompilationRequest} request
     * @param {?Downloader} downloader
     * @param {?string} userError
     */
    constructor(request, downloader, userError) {
        this.request = request;
        this.downloader = downloader;
        this.userError = userError;
    }
}

module.exports = LatexOnline;
