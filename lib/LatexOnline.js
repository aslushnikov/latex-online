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
     * @param {string} text
     * @return {!Promise<?Compilation>}
     */
    async compileURL(url) {
        var tmpFolder = await this._downloader.downloadURL(url, 'main.tex');
        if (!tmpFolder)
            return null;
        var requestId = await RequestIdFactory.idForFile(path.join(tmpFolder, 'main.tex'));
        if (!requestId) {
            this._downloader.cleanupFolder(tmpFolder);
            return null;
        }
        var compilation = await this._storage.getOrCreateCompilation(requestId);
        if (compilation.status !== Compilation.Status.New) {
            this._downloader.cleanupFolder(tmpFolder);
            return compilation;
        }
        var timeout = utils.minutes(1);
        var success = await Compiler.run(compilation, tmpFolder, 'main.tex', timeout);
        this._downloader.cleanupFolder(tmpFolder);
        return this._storage.finishCompilation(compilation.finalizeToken, success);
    }

    /**
     * @param {string} text
     * @return {!Promise<?Compilation>}
     */
    async compileText(text) {
        var id = await RequestIdFactory.idForText(text);
        var compilation = await this._storage.getOrCreateCompilation(id);
        if (compilation.status !== Compilation.Status.New)
            return compilation;
        var tmpFolder = await this._downloader.downloadText(text, 'main.tex');
        if (!tmpFolder)
            return this._storage.finishCompilation(compilation.finalizeToken, false);
        var timeout = utils.minutes(1);
        var success = await Compiler.run(compilation, tmpFolder, 'main.tex', timeout);
        this._downloader.cleanupFolder(tmpFolder);
        return this._storage.finishCompilation(compilation.finalizeToken, success);
    }
}

module.exports = LatexOnline;
