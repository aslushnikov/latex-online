var exec = require('child_process').execFile;
var fs = require('fs');
var crypto = require('crypto');

var UserErrors = {
    BranchNotFound: (url, branch) => `failed to find branch '${branch}' at ${url}`,
    BranchAmbiguity: (url, branch) => `multiple branches at ${url} matched requested ${branch}`,
};

class RequestIdFactory {
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
     * @param {string} target
     * @return {!Promise<!RequestIdFactory.Result>}
     */
    static idForFile(filePath, target) {
        var fulfill;
        var promise = new Promise(x => fulfill = x);

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
            var requestId = 'file-' + hash.read() + '-' + target;
            fulfill(new RequestIdFactory.Result(requestId, null));
        });

        fileHandle.pipe(hash);
        return promise;
    }

    /**
     * @param {string} gitURL
     * @param {string} target
     * @param {string} branch
     */
    static idForGit(gitURL, target, branch) {
        var fulfill;
        var promise = new Promise(x => fulfill = x);

        exec('git', ['ls-remote', gitURL, branch], (err, stdout, stderr) => {
            if(err !== null) {
                fulfill(new RequestIdFactory.Result(null, err.message));
                return;
            }

            var lines = stdout.split('\n');
            if (lines.lenght > 1) {
                fulfill(new RequestIdFactory.Result(null, UserErrors.BranchAmbiguity(gitURL, branch)));
                return;
            }
            if (!lines.length) {
                fulfill(new RequestIdFactory.Result(null, UserErrors.BranchNotFound(gitURL, branch)));
                return;
            }

            var hash = lines[0].split('\t')[0];
            var requestId = 'git-' + hash + '-' + target;
            fulfill(new RequestIdFactory.Result(requestId, null));
        });
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
