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
        console.assert(compilation.status === Compilation.Status.New, 'Cannot launch compilation with non-new status!');
        var logStream = fs.createWriteStream(compilation.logPath(), {flags: 'a'});

        var process = spawn('bash', [compileScriptPath, workdirPath, targetRelativePath, compilation.outputPath()]);

        process.stdout.pipe(logStream);
        process.stderr.pipe(logStream);

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
