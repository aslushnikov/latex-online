var exec = require('child_process').execFile;
var fs = require('fs');
var path = require('path');
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
     * @param {string=} workdir
     */
    constructor(contentHash, target, command, workdir) {
        this.target = target;
        this.command = command;
        this.workdir = workdir || path.dirname(target);
        this.fingerprint = `${command}:${contentHash}:${target}:${workdir}`;
    }

    /**
     * @param {string} text
     * @param {string} command
     * @return {!Promise<!{request:?CompilationRequest, userError:?string>}
     */
    static createForText(text, command) {
        var userError = validateCommand(command);
        if (userError)
            return {request: null, userError};
        var hash = crypto.createHash('md5').update(text).digest("hex");
        var userError = null;
        var request = new CompilationRequest(hash, 'main.tex', command);
        return Promise.resolve({request, userError});
    }

    /**
     * @param {string} filePath
     * @param {string} target
     * @return {!Promise<!{request:?CompilationRequest, userError:?string>}
     */
    static async createFileRequest(filePath, target, command) {
        var userError = validateCommand(command);
        if (userError)
            return {request: null, userError};
        var hash = await util.computeHash(filePath);
        if (!hash)
            return null;

        var request = new CompilationRequest(hash, target, command);
        return {request, userError: null};
    }

    /**
     * @param {string} gitURL
     * @param {string} target
     * @param {string} branch
     * @param {string} command
     * @param {string} workdir
     * @return {!Promise<!{request:?CompilationRequest, userError:?string>}
     */
    static createGitRequest(gitURL, target, branch, command, workdir) {
        var userError = validateCommand(command);
        if (userError)
            return {request: null, userError};
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
            var request = new CompilationRequest(hash, target, command, workdir);
            fulfill({userError, request});
        });
        return promise;
    }
}

function validateCommand(command) {
    if (command !== 'pdflatex' && command !== 'xelatex' && command !== 'lualatex')
        return `Unknown command: ${command}`;
    return null;
}

module.exports = CompilationRequest;
