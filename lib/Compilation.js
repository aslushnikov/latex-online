var path = require('path');

Compilation = class {
    /**
     * @param {string} requestId
     * @param {number} timestamp
     * @return {!Compilation}
     */
    static create(requestId, timestamp) {
        var id = 'compilation_' + ++Compilation._id;
        return new Compilation(id, requestId, false /* finished */, false /* success */, null /* directoryPath */, timestamp /* startTime */, timestamp /* accessTime */, timestamp /* endTime */, null /* userError */);
    }

    /**
     * @param {string} id
     * @param {string} requestId
     * @param {boolean} finished
     * @param {boolean} success
     * @param {?string} directoryPath
     * @param {number} startTime
     * @param {number} accessTime
     * @param {number} endTime
     * @param {string} userError
     */
    constructor(id, requestId, finished, success, directoryPath, startTime, accessTime, endTime, userError) {
        this.id = id;
        this.requestId = requestId;
        this.finished = finished;
        this.success = success;
        this.directoryPath = directoryPath;
        this.startTime = startTime;
        this.accessTime = accessTime;
        this.endTime = endTime;
        this.userError = userError;
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
        return new Compilation(this.id, this.requestId, this.finished, this.success, this.directoryPath, this.startTime, this.accessTime, this.endTime, this.userError);
    }
}

Compilation._id = 0;

module.exports = Compilation;

