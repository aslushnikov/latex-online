var path = require('path');
var Storage = require('./Storage');
var utils = require('./utilities');

/**
 * @implements {Storage}
 */
class FileSystemStorage extends Storage {
    /**
     * @param {string} storageDirectoryPath
     */
    constructor(storageDirectoryPath) {
        super();
        this._storageDirectoryPath = storageDirectoryPath;
        /** @type {!Map<string, !Compilation>} */
        this._requstIdToCompilation = new Map();
        /** @type {!Map<string, !Compilation>} */
        this._inFlightCompilations = new Map();
        /** @type {!Set<!Compilation>} */
        this._abortedCompilations = new Set();
    }

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
     * @override
     * @param {string} requestId
     * @param {boolean=} forceCreate
     * @return {!Promise<!Compilation>}
     */
    async getOrCreateCompilation(requestId, forceCreate) {
        var compilation = this._requstIdToCompilation.get(requestId);
        if (compilation && !forceCreate)
            return compilation.clone();
        if (compilation && forceCreate) {
            if (compilation.status === Compilation.Status.Running)
                this._abortedCompilations.add(compilation);
            else
                this._cleanupCompilationResults(compilation);
        }

        // Initialize compilation.
        var compilationId = 'compilation_' + (++FileSystemStorage._compilationId);
        compilation = new Compilation(compilationId, Compilation.Status.Running, null, null);
        this._requstIdToCompilation.set(requestId, compilation);

        // Try to create directory for compilation.
        var directoryPath = path.join(this._storageDirectoryPath, compilationId);
        var success = await utils.mkdir(directoryPath);
        if (!success) {
            compilation.status = Compilation.Status.Fail;
            return compilation.clone();
        }
        compilation.directoryPath = directoryPath;

        // Return "new" compilation for the very first requester.
        var finalizeToken = 'finalization:' + compilationId;
        var clientCompilation = new Compilation(compilationId, Compilation.Status.New, directoryPath, finalizeToken);
        this._inFlightCompilations.set(finalizeToken, compilation);
        return clientCompilation;
    }

    /**
     * @override
     * @param {string} finalizeToken
     * @param {boolean} success
     * @return {!Promise<?Compilation>}
     */
    async finishCompilation(finalizeToken, success) {
        var compilation = this._inFlightCompilations.get(finalizeToken);
        if (!compilation)
            return null;
        this._inFlightCompilations.delete(finalizeToken);
        var isAborted = this._abortedCompilations.has(compilation);
        this._abortedCompilations.delete(compilation);
        if (success && !isAborted)
            compilation.status = Compilation.Status.Success;
        else
            compilation.status = Compilation.Status.Fail;
        if (isAborted)
            await this._cleanupCompilationResults(compilation);
        return compilation.clone();
    }

    /**
     * @param {!Compilation} compilation
     * @return {!Promise}
     */
    async _cleanupCompilationResults(compilation) {
        var success = await utils.rmdirRecursive(compilation.directoryPath);
        if (!success)
            console.error(`ERROR: failed to cleanup compilation ${compilation.id}`);
    }
}

FileSystemStorage._id = 0;
FileSystemStorage._compilationId = 0;

module.exports = FileSystemStorage;
