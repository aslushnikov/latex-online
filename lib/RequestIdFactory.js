var fs = require('fs');
var crypto = require('crypto');

var UserErrors = {
};

class RequestIdFactory {
    constructor() {
    }

    /**
     * @param {string} text
     * @return {!Promise<!RequestIdFactory.Result>}
     */
    static idForText(text) {
        var requestId = 'text-' + crypto.createHash('md5').update(text).digest("hex");
        return Promise.resolve(new RequestIdFactory.Result(requestId, null));
    }

    /**
     * @param {string} filePath
     * @return {!Promise<!RequestIdFactory.Result>}
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
            fulfill(new RequestIdFactory.Result(null, null));
        });

        fileHandle.on('end', function() {
            hash.end();
            var requestId = 'url-' + hash.read();
            fulfill(new RequestIdFactory.Result(requestId, null));
        });

        fileHandle.pipe(hash);
        return promise;
    }
}

RequestIdFactory.Result = class {
    /**
     * @param {?string} requestId
     * @param {?string} userError
     */
    constructor(requestId, userError) {
        this.requestId = requestId;
        this.userError = userError;
    }
}

module.exports = RequestIdFactory;
