class Janitor {
    /**
     * @param {!LatexOnline} latexOnline
     * @param {number} compilationExpiration
     * @param {number} cleanTimeout
     */
    constructor(latexOnline, compilationExpiration, cleanTimeout) {
        this._latexOnline = latexOnline;
        this._compilationExpiration = compilationExpiration;
        this._cleanTimeout = cleanTimeout;
        this._cleanup();
    }

    async _cleanup() {
        var compilations = this._latexOnline.compilations().filter(compilation => compilation.finished);

        var currentTime = Date.now();
        for (var compilation of compilations) {
            var interval = currentTime - compilation.accessTime;
            console.log(interval);
            var expired = interval > this._compilationExpiration;
            if (expired) {
                console.log('remove!');
                this._latexOnline.removeCompilation(compilation.requestId);
            }
        }
        setTimeout(this._cleanup.bind(this), this._cleanTimeout);
    }
}

module.exports = Janitor;
