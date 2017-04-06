var fs = require('fs');
var exec = require('child_process').execFile;
var crypto = require('crypto');

var utils = {
    /**
     * @param {string} filePath
     * @return {!Promise<string>}
     */
    computeHash: function(filePath) {
        var fulfill;
        var promise = new Promise(x => fulfill = x);

        var fileHandle = fs.createReadStream(filePath);
        var hash = crypto.createHash('md5');
        hash.setEncoding('hex');

        fileHandle.on('error', function(err) {
            console.error(`ERROR: failed to compute md5 for ${filePath} - ${err}`);
            fulfill(null);
        });

        fileHandle.on('end', function() {
            hash.end();
            fulfill(hash.read());
        });

        fileHandle.pipe(hash);
        return promise;
    },

    /**
     * @param {string} path
     * @return {!Promise<boolean>}
     */
    mkdir: function(path) {
        var fulfill;
        var promise = new Promise(x => fulfill = x);
        fs.mkdir(path, createErrorHandler(`ERROR: failed to create directory ${path}.`, fulfill));
        return promise;
    },

    /**
     * @param {string} path
     * @return {!Promise<boolean>}
     */
    unlink: function(path) {
        var fulfill;
        var promise = new Promise(x => fulfill = x);
        fs.unlink(path, createErrorHandler(`ERROR: failed to remove file at ${path}.`, fulfill));
        return promise;
    },

    /**
     * @param {string} path
     * @return {!Promise<boolean>}
     */
    rmdir: function(path) {
        var fulfill;
        var promise = new Promise(x => fulfill = x);
        fs.rmdir(path, createErrorHandler(`ERROR: failed to remove directory at ${path}.`, fulfill));
        return promise;
    },

    /**
     * @param {string} path
     * @return {!Promise<boolean>}
     */
    rmdirRecursive: function(path) {
        var fulfill;
        var promise = new Promise(x => fulfill = x);
        var child = exec('rm', ['-rf', path], createErrorHandler(`ERROR: failed to remove directory recursively at ${path}.`, fulfill));
        return promise;
    },

    /**
     * @param {string} path
     * @param {string} text
     * @return {!Promise<boolean>}
     */
    writeFile: function(path, text) {
        var fulfill;
        var promise = new Promise(x => fulfill = x);
        fs.writeFile(path, text, 'utf8', createErrorHandler(`ERROR: failed to write file ${path}.`, fulfill));
        return promise;
    },

    /**
     * @param {string} path
     * @return {!Promise<boolean>}
     */
    exists: function(path) {
        return new Promise(x => fs.exists(path, x));
    },

    /**
     * @param {string} path
     * @return {!Promise<boolean>}
     */
    recreateFolderIfNonEmpty: async function(path) {
        var exists = await utils.exists(path);
        if (exists) {
            console.log('NOTE: recreating folder ' + path);
            var success = await utils.rmdirRecursive(path);
            if (!success)
                return false;
        }
        return utils.mkdir(path);
    },

    /**
     * @param {number} seconds
     * @return {number}
     */
    seconds: function(seconds) {
        return seconds * 1000;
    },

    /**
     * @param {number} mins
     * @return {number}
     */
    minutes: function(mins) {
        return mins * utils.seconds(60);
    },

    /**
     * @param {number} mins
     * @return {number}
     */
    hours: function(hours) {
        return hours * utils.minutes(60);
    },
};

module.exports = utils;

/**
 * @param {string} errorText
 * @param {function(boolean)} resolveCallback
 * @return {function(string)}
 */
function createErrorHandler(errorText, resolveCallback) {
    return err => {
        if (err) {
            console.error(`${errorText}. Got error: ${err}`);
            resolveCallback(false);
        } else {
            resolveCallback(true);
        }
    }
}
