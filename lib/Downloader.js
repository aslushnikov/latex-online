var utils = require('./utilities');
var path = require('path');

class Downloader {
    /**
     * @param {string} folderPath
     */
    constructor(folderPath) {
        this._folderPath = folderPath;
        /** @type {!Set<string>} */
        this._directories = new Set();
    }

    /**
     * @return {!Promise<?Downloader>}
     */
    static async create(folderPath) {
        var success = await utils.recreateFolderIfNonEmpty(folderPath);
        if (!success) {
            console.error("ERROR: failed to create folder for Downloader - " + folderPath);
            return null;
        }
        return new Downloader(folderPath);
    }

    /**
     * @param {string} text
     * @param {string} fileName
     * @return {!Promise<?string>}
     */
    async downloadText(text, fileName) {
        var id = ++Downloader._id;
        var folderPath = path.join(this._folderPath, 'tmp_' + id);
        var folderCreated = await utils.mkdir(folderPath);
        if (!folderCreated)
            return null;
        var filePath = path.join(folderPath, fileName);
        var fileCreated = await utils.writeFile(filePath, text);
        if (!fileCreated) {
            utils.rmdir(folderPath);
            return null;
        }
        this._directories.add(folderPath);
        return folderPath;
    }

    disableCleanupForDebugging() {
        this._dislabedCleanup = true;
    }

    /**
     * @param {string} directoryPath
     */
    cleanupFolder(directoryPath) {
        if (!this._directories.has(directoryPath)) {
            console.error(`ERROR: attempt to cleanup non-existing directory ${directoryPath}`);
            return;
        }
        if (this._dislabedCleanup) {
            console.warn('WARN: cleanup ignored for ' + directoryPath);
            return;
        }
        this._directories.delete(directoryPath);
        utils.rmdirRecursive(directoryPath);
    }
}

Downloader._id = 0;

module.exports = Downloader;
