var RequestIdFactory = require('./RequestIdFactory');
var Compilation = require('./Compilation');
var Compiler = require('./Compiler');
var utils = require('./utilities');

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
