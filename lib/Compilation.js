var path = require('path');

Compilation = class {
    /**
     * @param {string} id
     * @param {string} requestId
     * @param {!Compilation.Status} status
     * @param {?string} directoryPath
     * @param {number} startTime
     * @param {number} accessTime
     * @param {number} endTime
     */
    constructor(id, requestId, status, directoryPath, startTime, accessTime, endTime) {
        this.id = id;
        this.requestId = requestId;
        this.status = status;
        this.directoryPath = directoryPath;
        this.startTime = startTime;
        this.accessTime = accessTime;
        this.endTime = endTime;
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
        return new Compilation(this.id, this.requestId, this.status, this.directoryPath, this.startTime, this.accessTime, this.endTime);
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
