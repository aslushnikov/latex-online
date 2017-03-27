var path = require('path');

Compilation = class {
    /**
     * @param {string} id
     * @param {!Compilation.Status} status
     * @param {?string} directoryPath
     * @param {?string} finalizeToken
     */
    constructor(id, status, directoryPath, finalizeToken) {
        this.id = id;
        this.status = status;
        this.directoryPath = directoryPath;
        this.finalizeToken = finalizeToken;
    }

    /**
     * @return {?string}
     */
    logPath() {
        return this.directoryPath ? path.join(this.directoryPath, 'log.txt') : null;
    }

    /**
     * @return {?string}
     */
    outputPath() {
        return this.directoryPath ? path.join(this.directoryPath, 'output.pdf') : null;
    }

    /**
     * @return {!Compilation}
     */
    clone() {
        return new Compilation(this.id, this.status, this.directoryPath, this.finalizeToken);
    }
}
/** @enum {Symbol} */
Compilation.Status = {
    New: Symbol('Compilation.Status.New'),
    Running: Symbol('Compilation.Status.Running'),
    Success: Symbol('Compilation.Status.Success'),
    Fail: Symbol('Compilation.Status.Fail')
};

module.exports = Compilation;
