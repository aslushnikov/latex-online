var crypto = require('crypto');

class RequstIdFactory {
    constructor() {
    }

    /**
     * @param {string} text
     * @return {!Promise<string>}
     */
    static idForText(text) {
        var hash = crypto.createHash('md5').update(text).digest("hex");
        return Promise.resolve(hash);
    }
}

module.exports = RequstIdFactory;
