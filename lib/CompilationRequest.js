var exec = require('child_process').execFile;
var fs = require('fs');
var crypto = require('crypto');
var util = require('./utilities');

var UserErrors = {
    BranchNotFound: (url, branch) => `failed to find branch '${branch}' at ${url}`,
    BranchAmbiguity: (url, branch) => `multiple branches at ${url} matched requested ${branch}`,
};

class CompilationRequest {
    /**
     * @param {string} contentHash
     * @param {string} target
     * @param {string} command
     */
    constructor(contentHash, target, command) {
        this.target = target;
        this.command = command;
        this.fingerprint = `${command}:${contentHash}:${target}`;
    }

    /**
     * @param {string} text
     * @return {!Promise<!{request:?CompilationRequest, userError:?string>}
     */
    static createForText(text) {
        var hash = crypto.createHash('md5').update(text).digest("hex");
        var userError = null;
        var request = new CompilationRequest(hash, 'main.tex', 'pdflatex');
        return Promise.resolve({request, userError});
    }

    /**
     * @param {string} filePath
     * @param {string} target
     * @return {!Promise<!{request:?CompilationRequest, userError:?string>}
     */
    static async createFileRequest(filePath, target) {
        var hash = await util.computeHash(filePath);
        if (!hash)
            return null;

        var request = new CompilationRequest(hash, target, 'pdflatex');
        return {request, userError: null};
    }

    /**
     * @param {string} gitURL
     * @param {string} target
     * @param {string} branch
     * @return {!Promise<!{request:?CompilationRequest, userError:?string>}
     */
    static createGitRequest(gitURL, target, branch) {
        var fulfill;
        var promise = new Promise(x => fulfill = x);

        var userError = null;
        var request = null;

        exec('git', ['ls-remote', gitURL, branch], (err, stdout, stderr) => {
            if(err !== null) {
                userError = err.message;
                fulfill({request, userError});
                return;
            }

            var lines = stdout.split('\n');
            if (lines.lenght > 1) {
                userError = UserErrors.BranchAmbiguity(gitURL, branch);
                fulfill({request, userError});
                return;
            }
            if (!lines.length) {
                userError = UserErrors.BranchNotFound(gitURL, branch);
                fulfill({request, userError}); 
                return;
            }

            var hash = lines[0].split('\t')[0];
            // No need to include branch here: branch is already a part of GIT's SHA.
            var request = new CompilationRequest(hash, target, 'pdflatex');
            fulfill({userError, request});
        });
        return promise;
    }
}

module.exports = CompilationRequest;
