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

class DownloadManager {
    /**
     * @return {!Promise<?DownloadManager>}
     */
    static async create(folderPath) {
        var success = await utils.recreateFolderIfNonEmpty(folderPath);
        if (!success) {
            console.error("ERROR: failed to create folder for Downloader - " + folderPath);
            return null;
        }
        return new DownloadManager(folderPath);
    }

    /**
     * @param {string} folderPath
     */
    constructor(folderPath) {
        this._folderPath = folderPath;
        this._id = 0;
    }

    /**
     * @return {string}
     */
    _nextName() {
        var id = ++this._id;
        return path.join(this._folderPath, 'tmp_' + id);
    }

    /**
     * @param {string} text
     * @param {string} fileName
     * @return {!Downloader}
     */
    createTextDownloader(text, fileName) {
        var folderPath = this._nextName();
        return new Downloader(async () => {
            var success = await createFolder(folderPath);
            if (!success)
                return new DownloadResult(null, null);
            var filePath = path.join(folderPath, fileName);
            var fileCreated = await utils.writeFile(filePath, text);
            if (!fileCreated) {
                console.error(`ERROR: Downloader failed to write ${text.length} bytes of text into file ${filePath}`);
                utils.rmdir(folderPath);
                return new DownloadResult(null, null);
            }
            return new DownloadResult(folderPath, null);
        });
    }

    /**
     * @param {string} url
     * @return {!Downloader}
     */
    createGitDownloader(url) {
        var folderPath = this._nextName();
        return new Downloader(async () => {
            var exists = await utils.exists(folderPath);
            if (exists) {
                console.error(`ERROR: Downloader hit a conflict - directory ${folderPath} already exists`);
                return new DownloadResult(null, null);
            }
            var fulfill;
            var promise = new Promise(x => fulfill = x);
            exec('git', ['clone', '--depth', '1', url, folderPath], {timeout: utils.minutes(2)}, (err, stdout, stderr) => {
                if (err) {
                    console.error(`ERROR: Downloader failed to clone git repository. ${err.message}`);
                    fulfill(new DownloadResult(null, UserErrors.GitCloneFailed(url)));
                    return;
                }
                fulfill(new DownloadResult(folderPath, null));
            });
            return promise;
        });
    }

    /**
     * @param {string} url
     * @param {string} fileName
     * @return {!Downloader}
     */
    createURLDownloader(url, fileName) {
        var folderPath = this._nextName();
        return new Downloader(async () => {
            var success = await createFolder(folderPath);
            if (!success)
                return new DownloadResult(null, null);
            var filePath = path.join(folderPath, fileName);
            var fileHandle = fs.createWriteStream(filePath);

            var fulfill;
            var promise = new Promise(x => fulfill = x);

            request.get(url, {timeout:5000})
                .on('response', function(response) {
                    if (response.statusCode < 200 || response.statusCode >= 400) {
                        var error = UserErrors.LoadingBadResponse(url, response.statusCode);
                        console.info(`INFO: Downloader tried to load ${url} and got response status ${response.statusCode}`);
                        fulfill(new DownloadResult(null, error));
                    }
                })
                .on('error', function(err) {
                    utils.rmdirRecursive(folderPath);
                    var error = UserErrors.LoadingError(url, err);
                    console.info(`INFO: Downloader tried to load ${url} and got error - ${err}`);
                    fulfill(new DownloadResult(null, error));
                })
                .pipe(fileHandle);

            fileHandle
                .on('finish', () => {
                    fulfill(new DownloadResult(folderPath, null));
                });
            return promise;
        });
    }

    /**
     * @param {string} tarballPath
     * @return {!Downloader}
     */
    createTarballExtractor(tarballPath) {
        var folderPath = this._nextName();
        return new Downloader(async () => {
            var success = await createFolder(folderPath);
            if (!success)
                return new DownloadResult(null, null);
            var fulfill;
            var promise = new Promise(x => fulfill = x);
            exec('tar', ['-xf', tarballPath, '-C', folderPath], (err, stdout, stderr) => {
                if (err) {
                    utils.rmdirRecursive(folderPath);
                    console.error(`ERROR: Downloader failed to extract tarball. ${err.message}`);
                    fulfill(new DownloadResult(null, UserErrors.TarballExtractionFailed()));
                    return;
                }
                fulfill(new DownloadResult(folderPath, null));
            });
            return promise;
        });
    }
}

class Downloader {
    /**
     * @param {function()} downloadJob
     */
    constructor(downloadJob) {
        this.folderPath = null;
        this.userError = null;
        this._disposed = false;
        this._downloadJob = downloadJob;
    }

    /**
     * @return {!Promise}
     */
    downloadIfNeeded() {
        if (this._downloadPromise)
            return this._downloadPromise;
        this._downloadPromise = this._downloadJob.call(null).then(result => {
            this.folderPath = result.folderPath;
            this.userError = result.userError;
            return this;
        });
        return this._downloadPromise;
    }

    dispose() {
        if (this._disposed)
            return;
        this._disposed = true;
        if (this._dislabedCleanup) {
            console.warn('WARN: cleanup ignored for ' + this.folderPath);
            return;
        }
        if (!this.folderPath)
            return;
        utils.rmdirRecursive(this.folderPath);
    }
}

/**
 * @return {!Promise<?string>}
 */
async function createFolder(folderPath) {
    var success = await utils.mkdir(folderPath);
    if (!success)
        console.error(`ERROR: Downloader failed to create temporary directory ${folderPath}`);
    return success;
}

class DownloadResult {
    /**
     * @param {?string} folderPath
     * @param {?string} userError
     */
    constructor(folderPath, userError) {
        this.folderPath = folderPath;
        this.userError = userError;
    }
}

module.exports = DownloadManager;
