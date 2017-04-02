var path = require('path');

/**
 * @interface
 */
class Storage {
    /**
     * @param {string} requestId
     * @return {!Promise<!{compilation: !Compilation, writeToken: ?string}>}
     */
    getOrCreateCompilation(requestId) {
    }

    /**
     * @param {string} writeToken
     * @param {boolean} success
     * @return {!Promise<?Compilation>}
     */
    finishCompilation(writeToken, success) {
    }
};

module.exports = Storage;
