var RequestIdFactory = require('./RequestIdFactory');
var Compilation = require('./Compilation');
var Compiler = require('./Compiler');
var utils = require('./utilities');
var path = require('path');

class LatexOnline {
    /**
     * @param {!Storage} storage
     * @param {!Downloader} downloader
     */
    constructor(storage, downloader) {
        this._storage = storage;
        this._downloader = downloader;
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
            return new LatexOnline.Result(null, userError);

        var {compilation, writeToken} = await this._storage.getOrCreateCompilation(requestId, forceCompilation);
        if (compilation.status !== Compilation.Status.New)
            return new LatexOnline.Result(compilation, null);

        var {folderPath, userError} = await this._downloader.downloadGit(url);
        if (!folderPath) {
            await this._storage.finishCompilation(writeToken, false /* success */);
            return new LatexOnline.Result(null, userError);
        }
        var timeout = utils.minutes(5);
        var success = await Compiler.run(compilation, folderPath, target, timeout);
        this._downloader.cleanupFolder(folderPath);
        compilation = await this._storage.finishCompilation(writeToken, success);
        return new LatexOnline.Result(compilation, null);
    }

    /**
     * @param {string} text
     * @param {boolean} forceCompilation
     * @return {!Promise<!LatexOnline.Result>}
     */
    async compileURL(url, forceCompilation) {
        var downloadResult = await this._downloader.downloadURL(url, 'main.tex')
        var tmpFolder = downloadResult.folderPath;
        if (!tmpFolder)
            return new LatexOnline.Result(null, downloadResult.userError);
        var {requestId, userError} = await RequestIdFactory.idForFile(path.join(tmpFolder, 'main.tex'));
        if (!requestId) {
            this._downloader.cleanupFolder(tmpFolder);
            return new LatexOnline.Result(null, userError);
        }
        var {compilation, writeToken} = await this._storage.getOrCreateCompilation(requestId, forceCompilation);
        if (compilation.status !== Compilation.Status.New) {
            this._downloader.cleanupFolder(tmpFolder);
            return new LatexOnline.Result(compilation, null);
        }
        var timeout = utils.minutes(1);
        var success = await Compiler.run(compilation, tmpFolder, 'main.tex', timeout);
        this._downloader.cleanupFolder(tmpFolder);
        compilation = await this._storage.finishCompilation(writeToken, success);
        return new LatexOnline.Result(compilation, null);
    }

    /**
     * @param {string} text
     * @param {boolean} forceCompilation
     * @return {!Promise<!LatexOnline.Result>}
     */
    async compileText(text, forceCompilation) {
        var {requestId} = await RequestIdFactory.idForText(text);
        var {compilation, writeToken} = await this._storage.getOrCreateCompilation(requestId, forceCompilation);
        if (compilation.status !== Compilation.Status.New)
            return new LatexOnline.Result(compilation, null);
        var {folderPath, userError} = await this._downloader.downloadText(text, 'main.tex');
        if (!folderPath) {
            await this._storage.finishCompilation(writeToken, false);
            return new LatexOnline.Result(null, userError);
        }
        var timeout = utils.minutes(1);
        var success = await Compiler.run(compilation, folderPath, 'main.tex', timeout);
        this._downloader.cleanupFolder(folderPath);
        compilation = await this._storage.finishCompilation(writeToken, success);
        return new LatexOnline.Result(compilation, null);
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
        var {compilation, writeToken} = await this._storage.getOrCreateCompilation(requestId, forceCompilation);
        if (compilation.status !== Compilation.Status.New)
            return new LatexOnline.Result(compilation, null);

        var {folderPath, userError} = await this._downloader.extractTarball(tarballPath);
        if (!folderPath) {
            await this._storage.finishCompilation(writeToken, false);
            return new LatexOnline.Result(null, userError);
        }
        var timeout = utils.minutes(5);
        var success = await Compiler.run(compilation, folderPath, target, timeout);
        this._downloader.cleanupFolder(folderPath);
        compilation = await this._storage.finishCompilation(writeToken, success);
        return new LatexOnline.Result(compilation, null);
    }
}

LatexOnline.Result = class {
    /**
     * @param {?Compilation} compilation
     * @param {?string} userError
     */
    constructor(compilation, userError) {
        this.compilation = compilation;
        this.userError = userError;
    }
}

module.exports = LatexOnline;
