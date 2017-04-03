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
     * @return {!Downloader}
     */
    createTextDownloader(text) {
        var folderPath = this._nextName();
        var target = 'main.tex';
        return new Downloader(() => downloadText(folderPath, target, text));
    }

    /**
     * @param {string} url
     * @param {string} target
     * @return {!Downloader}
     */
    createGitDownloader(url, target) {
        var folderPath = this._nextName();
        return new Downloader(() => downloadGit(folderPath, target, url));
    }

    /**
     * @param {string} url
     * @return {!Downloader}
     */
    createURLDownloader(url) {
        var folderPath = this._nextName();
        var target = 'main.tex';
        return new Downloader(() => downloadURL(folderPath, target, url));
    }

    /**
     * @param {string} tarballPath
     * @param {string} target
     * @return {!Downloader}
     */
    createTarballExtractor(tarballPath, target) {
        var folderPath = this._nextName();
        return new Downloader(() => extractTarball(folderPath, target, tarballPath));
    }
}

class Downloader {
    /**
     * @param {function()} downloadJob
     */
    constructor(downloadJob) {
        this.folderPath = null;
        this.target = null;
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
        this._downloadPromise = this._downloadJob.call(null, this.folderPath, this.target).then(result => {
            this.folderPath = result.folderPath;
            this.target = result.target;
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

/**
 * @param {string} folderPath
 * @param {string} target
 * @param {string} text
 * @return {!Promise<!DownloadResult>}
 */
async function downloadText(folderPath, target, text) {
    var success = await createFolder(folderPath);
    if (!success)
        return new DownloadResult(null, null, null);
    var filePath = path.join(folderPath, target);
    var fileCreated = await utils.writeFile(filePath, text);
    if (!fileCreated) {
        console.error(`ERROR: Downloader failed to write ${text.length} bytes of text into file ${filePath}`);
        utils.rmdir(folderPath);
        return new DownloadResult(null, null, null);
    }
    return new DownloadResult(folderPath, target, null);
}

/**
 * @param {string} folderPath
 * @param {string} target
 * @param {string} url
 * @return {!Promise<!DownloadResult>}
 */
async function downloadURL(folderPath, target, url) {
    var success = await createFolder(folderPath);
    if (!success)
        return new DownloadResult(null, null, null);
    var filePath = path.join(folderPath, target);
    var fileHandle = fs.createWriteStream(filePath);

    var fulfill;
    var promise = new Promise(x => fulfill = x);

    request.get(url, {timeout:5000})
        .on('response', function(response) {
            if (response.statusCode < 200 || response.statusCode >= 400) {
                var error = UserErrors.LoadingBadResponse(url, response.statusCode);
                console.info(`INFO: Downloader tried to load ${url} and got response status ${response.statusCode}`);
                fulfill(new DownloadResult(null, null, error));
            }
        })
        .on('error', function(err) {
            utils.rmdirRecursive(folderPath);
            var error = UserErrors.LoadingError(url, err);
            console.info(`INFO: Downloader tried to load ${url} and got error - ${err}`);
            fulfill(new DownloadResult(null, null, error));
        })
        .pipe(fileHandle);

    fileHandle
        .on('finish', () => {
            fulfill(new DownloadResult(folderPath, target, null));
        });
    return promise;
}

/**
 * @param {string} folderPath
 * @param {string} target
 * @param {string} url
 * @return {!Promise<!DownloadResult>}
 */
async function downloadGit(folderPath, target, url) {
    var exists = await utils.exists(folderPath);
    if (exists) {
        console.error(`ERROR: Downloader hit a conflict - directory ${folderPath} already exists`);
        return new DownloadResult(null, null, null);
    }
    var fulfill;
    var promise = new Promise(x => fulfill = x);
    exec('git', ['clone', '--depth', '1', url, folderPath], {timeout: utils.minutes(2)}, (err, stdout, stderr) => {
        if (err) {
            console.error(`ERROR: Downloader failed to clone git repository. ${err.message}`);
            fulfill(new DownloadResult(null, null, UserErrors.GitCloneFailed(url)));
            return;
        }
        fulfill(new DownloadResult(folderPath, target, null));
    });
    return promise;
}

/**
 * @param {string} folderPath
 * @param {string} target
 * @param {string} tarballPath
 * @return {!Promise<!DownloadResult>}
 */
async function extractTarball(folderPath, target, tarballPath) {
    var success = await createFolder(folderPath);
    if (!success)
        return new DownloadResult(null, null, null);
    var fulfill;
    var promise = new Promise(x => fulfill = x);
    exec('tar', ['-xf', tarballPath, '-C', folderPath], (err, stdout, stderr) => {
        if (err) {
            utils.rmdirRecursive(folderPath);
            console.error(`ERROR: Downloader failed to extract tarball. ${err.message}`);
            fulfill(new DownloadResult(null, null, UserErrors.TarballExtractionFailed()));
            return;
        }
        fulfill(new DownloadResult(folderPath, target, null));
    });
    return promise;
}

class DownloadResult {
    /**
     * @param {?string} folderPath
     * @param {?string} target
     * @param {?string} userError
     */
    constructor(folderPath, target, userError) {
        this.folderPath = folderPath;
        this.target = target;
        this.userError = userError;
    }
}

module.exports = DownloadManager;
