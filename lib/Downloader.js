var exec = require('child_process').execFile;
var fs = require('fs');
var utils = require('./utilities');
var path = require('path');
var request = require('request');

var UserErrors = {
    LoadingBadResponse: (url, statusCode) => `failed to download URL ${url} - got response status ${statusCode}`,
    LoadingError: (url, error) => `error while loading ${url}: ${error}`,
    GitCloneFailed: (url) => `failed to clone git repository ${url}`,
    TarballExtractionFailed: () => `failed to extract tarball`,
}

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
     * @return {string}
     */
    _nextName() {
        var id = ++Downloader._id;
        return path.join(this._folderPath, 'tmp_' + id);
    }

    /**
     * @return {!Promise<?string>}
     */
    async _createFolder() {
        var folderPath = this._nextName();
        var success = await utils.mkdir(folderPath);
        if (!success)
            console.error(`ERROR: Downloader failed to create temporary directory ${folderPath}`);
        return success ? folderPath : null;
    }

    /**
     * @param {string} text
     * @param {string} fileName
     * @return {!Promise<!Downloader.Result>}
     */
    async downloadText(text, fileName) {
        var folderPath = await this._createFolder();
        if (!folderPath)
            return new Downloader.Result(null, null);
        var filePath = path.join(folderPath, fileName);
        var fileCreated = await utils.writeFile(filePath, text);
        if (!fileCreated) {
            console.error(`ERROR: Downloader failed to write ${text.length} bytes of text into file ${filePath}`);
            utils.rmdir(folderPath);
            return new Downloader.Result(null, null);
        }
        this._directories.add(folderPath);
        return new Downloader.Result(folderPath, null);
    }

    /**
     * @param {string} text
     * @param {string} fileName
     * @return {!Promise<!Downloader.Result>}
     */
    async downloadURL(url, fileName) {
        var folderPath = await this._createFolder();
        if (!folderPath)
            return new Downloader.Result(null, null);
        var filePath = path.join(folderPath, fileName);
        var fileHandle = fs.createWriteStream(filePath);

        var fulfill;
        var promise = new Promise(x => fulfill = x);

        request.get(url, {timeout:5000})
            .on('response', function(response) {
                if (response.statusCode < 200 || response.statusCode >= 400) {
                    var error = UserErrors.LoadingBadResponse(url, response.statusCode);
                    console.info(`INFO: Downloader tried to load ${url} and got response status ${response.statusCode}`);
                    fulfill(new Downloader.Result(null, error));
                }
            })
            .on('error', function(err) {
                utils.rmdirRecursive(folderPath);
                var error = UserErrors.LoadingError(url, err);
                console.info(`INFO: Downloader tried to load ${url} and got error - ${err}`);
                fulfill(new Downloader.Result(null, error));
            })
            .pipe(fileHandle);

        fileHandle
            .on('finish', () => {
                this._directories.add(folderPath);
                fulfill(new Downloader.Result(folderPath, null));
            });
        return promise;
    }

    /**
     * @param {string} url
     * @return {!Promise<!Downloader.Result>}
     */
    async downloadGit(url) {
        var folderPath = this._nextName();
        var exists = await utils.exists(folderPath);
        if (exists) {
            console.error(`ERROR: Downloader hit a conflict - directory ${folderPath} already exists`);
            return new Downloader.Result(null, null);
        }
        var fulfill;
        var promise = new Promise(x => fulfill = x);
        exec('git', ['clone', '--depth', '1', url, folderPath], (err, stdout, stderr) => {
            if (err) {
                console.error(`ERROR: Downloader failed to clone git repository. ${err.message}`);
                fulfill(new Downloader.Result(null, UserErrors.GitCloneFailed(url)));
                return;
            }
            this._directories.add(folderPath);
            fulfill(new Downloader.Result(folderPath, null));
        });
        return promise;
    }

    /**
     * @param {string} filePath
     * @return {!Promise<!Downloader.Result>}
     */
    async extractTarball(filePath) {
        var folderPath = await this._createFolder();
        if (!folderPath)
            return new Downloader.Result(null, null);
        var fulfill;
        var promise = new Promise(x => fulfill = x);
        exec('tar', ['-xf', filePath, '-C', folderPath], (err, stdout, stderr) => {
            if (err) {
                utils.rmdirRecursive(folderPath);
                console.error(`ERROR: Downloader failed to extract tarball. ${err.message}`);
                fulfill(new Downloader.Result(null, UserErrors.TarballExtractionFailed()));
                return;
            }
            this._directories.add(folderPath);
            fulfill(new Downloader.Result(folderPath, null));
        });
    }

    disableCleanupForDebugging() {
        this._dislabedCleanup = true;
    }

    /**
     * @param {string} directoryPath
     */
    cleanupFolder(directoryPath) {
        if (!this._directories.has(directoryPath)) {
            console.error(`ERROR: Downloader attempted to cleanup non-existing directory ${directoryPath}`);
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

Downloader.Result = class {
    /**
     * @param {?string} folderPath
     * @param {?string} userError
     */
    constructor(folderPath, userError) {
        this.folderPath = folderPath;
        this.userError = userError;
    }
}

module.exports = Downloader;
