class StorageJanitor {
    /**
     * @param {!Storage} storage
     * @param {number} storageExpiration
     * @param {number} cleanTimeout
     */
    constructor(storage, storageExpiry, cleanTimeout) {
        this._storage = storage;
        this._storageExpiry = storageExpiry;
        this._cleanTimeout = cleanTimeout;
        this._cleanup();
    }

    async _cleanup() {
        var [currentTime, compilations] = await Promise.all([
            this._storage.currentTime(),
            this._storage.finishedCompilations(),
        ]);

        compilations = compilations.filter(compilation => {
            var interval = currentTime - compilation.accessTime;
            return interval > this._storageExpiry;
        });

        var removePromises = compilations.map(compilation => this._storage.removeFinishedCompilation(compilation.requestId));
        await Promise.all(removePromises);
        setTimeout(this._cleanup.bind(this), this._cleanTimeout);
    }
}

module.exports = StorageJanitor;
