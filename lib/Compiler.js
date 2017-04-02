var path = require('path');
var fs = require('fs');
var spawn = require('child_process').spawn;

var compileScriptPath = path.join(__dirname, '..', 'shells', 'compile.sh');

class Compiler {
    /**
     * @param {!Compilation} compilation
     * @param {string} workdirPath
     * @param {string} targetRelativePath
     * @param {number} timeout
     * @return {!Promise<boolean>}
     */
    static run(compilation, workdirPath, targetRelativePath, timeout) {
        console.assert(compilation.status === Compilation.Status.Running, 'Cannot launch compilation with non-running status!');

        var process = spawn('bash', [compileScriptPath, workdirPath, targetRelativePath, compilation.outputPath(), compilation.logPath()]);

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
