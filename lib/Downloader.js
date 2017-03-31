var fs = require('fs');
var utils = require('./utilities');
var path = require('path');
var request = require('request');

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
     * @return {!Promise<?string>}
     */
    async _createFolder() {
        var id = ++Downloader._id;
        var folderPath = path.join(this._folderPath, 'tmp_' + id);
        var success = await utils.mkdir(folderPath);
        return success ? folderPath : null;
    }

    /**
     * @param {string} text
     * @param {string} fileName
     * @return {!Promise<?string>}
     */
    async downloadText(text, fileName) {
        var folderPath = await this._createFolder();
        if (!folderPath)
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

    /**
     * @param {string} text
     * @param {string} fileName
     * @return {!Promise<?string>}
     */
    async downloadURL(url, fileName) {
        var folderPath = await this._createFolder();
        if (!folderPath)
            return null;
        var filePath = path.join(folderPath, fileName);
        var fileHandle = fs.createWriteStream(filePath);

        var fulfill;
        var promise = new Promise(x => fulfill = x);

        request.get(url, {timeout:5000})
            .on('response', function(response) {
                if (response.statusCode < 200 || response.statusCode >= 400)
                    fulfill(null);
            })
            .on('error', function(err) {
                console.error(`ERROR: failed to get resource ${url} - ${err}`);
                utils.rmdirRecursive(folderPath);
                fulfill(null);
            })
            .pipe(fileHandle);

        fileHandle
            .on('finish', () => {
                this._directories.add(folderPath);
                fulfill(folderPath);
            })
        return promise;
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
