var path = require('path');

/**
 * @interface
 */
class Storage {
    /**
     * @param {string} requestId
     * @return {!Promise<!Compilation>}
     */
    getOrCreateCompilation(requestId) {
    }

    /**
     * @param {string} finalizeToken
     * @param {boolean} success
     * @return {!Promise<?Compilation>}
     */
    finishCompilation(finalizeToken, success) {
    }
};

module.exports = Storage;
