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
        this._requestIdToCompilation = new Map();

        /** @type {!Map<string, !Compilation>} */
        this._writeTokenToCompilation = new Map();
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
     * @return {!Promise<!{compilation: !Compilation, writeToken: ?string}>}
     */
    async getOrCreateCompilation(requestId) {
        var compilation = this._requestIdToCompilation.get(requestId);
        if (compilation)
            return {compilation: compilation.clone(), writeToken: null};

        // Initialize compilation.
        var compilationId = 'compilation_' + (++FileSystemStorage._compilationId);
        compilation = new Compilation(compilationId, Compilation.Status.Running, null, null);
        this._requestIdToCompilation.set(requestId, compilation);

        // Try to create directory for compilation.
        var directoryPath = path.join(this._storageDirectoryPath, compilationId);
        var success = await utils.mkdir(directoryPath);
        if (!success) {
            compilation.status = Compilation.Status.Fail;
            return {compilation: compilation.clone(), writeToken: null};
        }
        compilation.directoryPath = directoryPath;

        // Generate a write token and assign it with compilation.
        var writeToken = 'write-token:' + compilationId;
        this._writeTokenToCompilation.set(writeToken, compilation);

        // Return "new" compilation for the very first requester.
        var newCompilation = compilation.clone();
        newCompilation.status = Compilation.Status.New;
        return {compilation: newCompilation, writeToken};
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
        compilation.status = success ? Compilation.Status.Success : Compilation.Status.Fail;
        return compilation.clone();
    }

    /**
     * @param {string} compilationId
     * @return {!Promise<boolean>}
     */
    async removeFinishedCompilation(requestId) {
        var compilation = this._requestIdToCompilation.get(requestId);
        // Disallow removal of running compilations.
        if (!compilation || compilation.status === Compilation.Status.Running)
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

FileSystemStorage._id = 0;
FileSystemStorage._compilationId = 0;

module.exports = FileSystemStorage;
