var path = require('path');
var Storage = require('./Storage');
var utils = require('./utilities');

/**
 * @implements {Storage}
 */
class FileSystemStorage extends Storage {
    /**
     * @param {string} storageDirectoryPath
     * @return {!Promise<?FileSystemStorage>}
     */
    static async create(storageDirectoryPath) {
        var success = await utils.recreateFolderIfNonEmpty(storageDirectoryPath);
        if (!success) {
            console.error('ERROR: failed to create folder for FileSystemStorage - ' + storageDirectoryPath);
            return null;
        }
        return new FileSystemStorage(storageDirectoryPath);
    }

    /**
     * @param {string} storageDirectoryPath
     */
    constructor(storageDirectoryPath) {
        super();
        this._storageDirectoryPath = storageDirectoryPath;

        this._compilationId = 0;

        /** @type {!Map<string, !Compilation>} */
        this._requestIdToCompilation = new Map();

        /** @type {!Map<string, !Compilation>} */
        this._writeTokenToCompilation = new Map();
    }

    /**
     * @override
     * @param {string} requestId
     * @return {!Promise<!{compilation: !Compilation, writeToken: ?string}>}
     */
    async getOrCreateCompilation(requestId) {
        var compilation = this._requestIdToCompilation.get(requestId);
        if (compilation) {
            compilation.accessTime = Date.now();
            return {compilation: compilation.clone(), writeToken: null};
        }

        // Initialize compilation.
        compilation = Compilation.create(requestId, Date.now());
        this._requestIdToCompilation.set(requestId, compilation);

        // Try to create directory for compilation.
        var directoryPath = path.join(this._storageDirectoryPath, compilation.id);
        var success = await utils.mkdir(directoryPath);
        if (!success) {
            compilation.success = false;
            compilation.finished = true;
            return {compilation: compilation.clone(), writeToken: null};
        }
        compilation.directoryPath = directoryPath;

        // Generate a write token and assign it with compilation.
        var writeToken = 'write-token:' + compilation.id;
        this._writeTokenToCompilation.set(writeToken, compilation);

        return {compilation, writeToken};
    }

    /**
     * @return {!Promise<!Array<!Compilation>>}
     */
    async finishedCompilations() {
        var compilations = Array.from(this._requestIdToCompilation.values());
        return compilations.filter(compilation => compilation.finished);
    }

    /**
     * @override
     * @param {string} writeToken
     * @param {boolean} success
     * @return {!Promise<?Compilation>}
     */
    async finishCompilation(writeToken, success) {
        var compilation = this._writeTokenToCompilation.get(writeToken);
        if (!compilation)
            return null;
        this._writeTokenToCompilation.delete(writeToken);
        compilation.finished = true;
        compilation.success = success;
        var time = Date.now();
        compilation.endTime = time;
        compilation.accessTime = time;
        return compilation.clone();
    }

    /**
     * @return {!Promise<number>}
     */
    async currentTime() {
        return Date.now();
    }

    /**
     * @param {string} requestId
     * @return {!Promise<boolean>}
     */
    async removeFinishedCompilation(requestId) {
        var compilation = this._requestIdToCompilation.get(requestId);
        // Disallow removal of running compilations.
        if (!compilation || !compilation.finished)
            return false;
        this._requestIdToCompilation.delete(requestId);

        if (!compilation.directoryPath)
            return true;
        var success = await utils.rmdirRecursive(compilation.directoryPath);
        if (!success)
            console.error(`ERROR: failed to cleanup compilation ${compilation.id}`);
        return true;
    }
}

module.exports = FileSystemStorage;
