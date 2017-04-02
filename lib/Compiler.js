var EventEmitter = require('events');
var path = require('path');
var fs = require('fs');
var spawn = require('child_process').spawn;
var utils = require('./utilities');

var compileScriptPath = path.join(__dirname, '..', 'shells', 'compile.sh');

class Compiler extends EventEmitter{
    /**
     * @param {!Storage} storage
     * @param {string} requestId
     * @param {!Downloader} downloader
     */
    constructor(storage, requestId, downloader) {
        super();
        this._storage = storage;
        this.requestId = requestId;
        this.downloader = downloader;
    }

    async run(forceCompilation) {
        this._innerRunCompilation(this._storage, this.requestId, this.downloader, forceCompilation)
            .catch((e) => errorHandler.call(this, e))
            .then(() => this.downloader.dispose())

        /**
         * @param {!Error} e
         */
        function errorHandler(e) {
            console.error(`ERROR: Compiler hit an error during execution - ${e.message}`);
            this.emit(Compiler.Events.Finished, requestId, null);
        }
    }

    /**
     * @param {!Storage} storage
     * @param {string} requestId
     * @param {!Downloader} downloader
     * @param {boolean} forceCompilation
     * @return {!Promise<!{>}
     */
    async _innerRunCompilation(storage, requestId, downloader, forceCompilation) {
        if (forceCompilation)
            await storage.removeFinishedCompilation(requestId);
        var {compilation, writeToken} = await storage.getOrCreateCompilation(requestId);
        console.assert(compilation, 'ERROR: storage.getOrCreateCompilation did not return compilation!');
        if (compilation.finished) {
            this.emit(Compiler.Events.Finished, requestId, compilation);
            return;
        }
        if (!writeToken)
            return;

        var {folderPath, target, userError} = await downloader.downloadIfNeeded();
        if (!folderPath) {
            compilation = await storage.finishCompilation(writeToken, false /* success */, userError);
            this.emit(Compiler.Events.Finished, requestId, compilation);
            return;
        }
        var timeout = utils.minutes(5);
        var success = await this._runShellScript(folderPath, target, compilation.outputPath(), compilation.logPath(), timeout);
        compilation = await storage.finishCompilation(writeToken, success);
        this.emit(Compiler.Events.Finished, requestId, compilation);
    }

    /**
     * @param {string} workdirPath
     * @param {string} targetRelativePath
     * @param {string} outputPath
     * @param {string} logPath
     * @param {number} timeout
     * @return {!Promise<boolean>}
     */
    _runShellScript(workdirPath, targetRelativePath, outputPath, logPath, timeout) {

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

Compiler.Events = {
    Finished: "Finished"
};

module.exports = Compiler;
