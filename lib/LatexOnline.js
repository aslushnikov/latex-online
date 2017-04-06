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
     * @param {!CompilationRequest} request
     * @param {!Downloader} downloader
     * @param {boolean} forceCreate
     * @return {!Compilation}
     */
    _getOrCreateCompilation(request, downloader, forceCreate) {
        var compilation = this._fingerprintToCompilation.get(request.fingerprint);
        if (forceCreate && compilation) {
            this.removeCompilation(compilation);
            compilation = null;
        }
        if (compilation) {
            compilation.accessTime = Date.now();
        } else {
            compilation = new Compilation(request, downloader, this._resultsFolder);
            this._fingerprintToCompilation.set(request.fingerprint, compilation);
        }
        return compilation;
    }

    /**
     * @return {!Array<!Compilation>}
     */
    compilations() {
        return Array.from(this._fingerprintToCompilation.values());
    }

    /**
     * @param {!Compilation} compilation
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
     * @param {boolean} forceCompilation
     * @return {!Promise<!LatexOnline.Result>}
     */
    async compileGit(url, target, branch, forceCompilation) {
        var {request, userError} = await CompilationRequest.createGitRequest(url, target, branch);
        if (!request)
            return new LatexOnline.Result(null, userError);
        var downloader = this._downloadManager.createGitDownloader(url);
        var compilation = this._getOrCreateCompilation(request, downloader, forceCompilation);
        return new LatexOnline.Result(compilation, null);
    }

    /**
     * @param {string} url
     * @param {boolean} forceCompilation
     * @return {!Promise<!LatexOnline.Result>}
     */
    async compileURL(url, forceCompilation) {
        var fileName = 'main.tex';
        var downloader = this._downloadManager.createURLDownloader(url, fileName);
        var {folderPath, userError} = await downloader.downloadIfNeeded();
        if (!folderPath)
            return new LatexOnline.Result(null, userError);
        var {request, userError} = await CompilationRequest.createFileRequest(path.join(folderPath, fileName), fileName);
        if (!request) {
            downloader.dispose();
            return new LatexOnline.Result(null, userError);
        }
        var compilation = this._getOrCreateCompilation(request, downloader, forceCompilation);
        return new LatexOnline.Result(compilation, null);
    }

    /**
     * @param {string} text
     * @param {boolean} forceCompilation
     * @return {!Promise<!LatexOnline.Result>}
     */
    async compileText(text, forceCompilation) {
        var {request} = await CompilationRequest.createForText(text);
        var downloader = this._downloadManager.createTextDownloader(text, request.target);
        var compilation = this._getOrCreateCompilation(request, downloader, forceCompilation);
        return new LatexOnline.Result(compilation, null);
    }

    /**
     * @param {string} tarballPath
     * @param {string} target
     * @param {boolean} forceCompilation
     * @return {!Promise<!LatexOnline.Result>}
     */
    async compileTarball(tarballPath, target, forceCompilation) {
        var {request, userError} = await CompilationRequest.createFileRequest(tarballPath, target);
        if (!request)
            return new LatexOnline.Result(null, userError);
        var downloader = this._downloadManager.createTarballExtractor(tarballPath);
        var compilation = this._getOrCreateCompilation(request, downloader, forceCompilation);
        return new LatexOnline.Result(compilation, null);
    }
}

LatexOnline.Result = class {
    /**
     * @param {?Compiler} compiler
     * @param {?string} userError
     */
    constructor(compilation, userError) {
        this.compilation = compilation;
        this.userError = userError;
    }
}

module.exports = LatexOnline;
