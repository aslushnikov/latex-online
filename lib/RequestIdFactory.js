var fs = require('fs');
var crypto = require('crypto');

class RequstIdFactory {
    constructor() {
    }

    /**
     * @param {string} text
     * @return {!Promise<string>}
     */
    static idForText(text) {
        var hash = crypto.createHash('md5').update(text).digest("hex");
        return Promise.resolve(hash);
    }

    /**
     * @param {string} filePath
     * @return {!Promise<string>}
     */
    static idForFile(filePath) {
        var fulfill;
        var promise = new Promise(x => fulfill = x);
        var crypto = require('crypto');

        // the file you want to get the hash
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
    }
}

module.exports = RequstIdFactory;
