var path = require('path');
var fs = require('fs');
var spawn = require('child_process').spawn;

var compileScriptPath = path.join(__dirname, '..', 'shells', 'compile.sh');

class Compiler {
    /**
     * @param {string} workdirPath
     * @param {string} targetRelativePath
     * @param {string} outputPath
     * @param {string} logPath
     * @param {number} timeout
     * @return {!Promise<boolean>}
     */
    static run(workdirPath, targetRelativePath, outputPath, logPath, timeout) {

        var process = spawn('bash', [compileScriptPath, workdirPath, targetRelativePath, outputPath, logPath]);

        var fulfill;
        var promise = new Promise(x => fulfill = x);
        var jobTimeout = setTimeout(() => process.kill(), timeout);
        process.on('close', function (code) {
            clearTimeout(jobTimeout);
            fulfill(code === 0);
        });
        return promise;
    }
}

module.exports = Compiler;
