var fs = require('fs');
var utils = require('./utilities');

var MAX_HEALTH_POINTS = 100;
var SCRAPE_TIMEOUT = utils.minutes(1);

class HealthMonitor {
    /**
     * @param {!DownloadManager} downloadManager
     * @param {!LatexOnline} latexOnline
     */
    constructor(latexOnline) {
        this._latexOnline = latexOnline;
        this._healthPoints = [];
        this._startTime = Date.now();
        this._getHealthPoint();
    }

    async _getHealthPoint() {
        var compilations = this._latexOnline.compilations();
        var compilationsCount = compilations.length;
        var inflightCompilationsCount = compilations.filter(compilation => !compilation.finished).length;
        var [resultsFolderSize, tmpFolderSize] = await Promise.all([
            utils.dirSize(this._latexOnline.resultsFolderPath()),
            utils.dirSize(this._latexOnline.tmpFolderPath()),
        ]);
        var timestamp = Date.now();
        this._healthPoints.push({
            compilationsCount,
            inflightCompilationsCount,
            resultsFolderSize,
            tmpFolderSize,
            timestamp
        });
        if (this._healthPoints.length > 2 * MAX_HEALTH_POINTS)
            this._healthPoints = this._healthPoints.slice(this._healthPoints.length - MAX_HEALTH_POINTS);
        setTimeout(this._getHealthPoint.bind(this), SCRAPE_TIMEOUT);
    }

    /**
     * @return {number}
     */
    uptime() {
        return Date.now() - this._startTime;
    }

    /**
     * @return {!Array<!Object>}
     */
    healthPoints() {
        return this._healthPoints.slice(this._healthPoints.length - MAX_HEALTH_POINTS);
    }
}

module.exports = HealthMonitor;
