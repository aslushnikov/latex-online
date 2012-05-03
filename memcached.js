/*
 * Wrapping differnt memcached clients
 * */

var mc = require('mc');

module.exports = function Memcached() {
    this.client = new mc.Client("localhost", mc.Adapter.raw);
    this.connect = function() {
        this.client.connect(function() {
              console.log("Connected to the localhost memcache on port 11211!");
        });
    }

    this.store = function(key, data, callback) {
        callback = callback || function(error, result) {
            if (error) {
                console.error(error);
            } else {
                console.log("" + result.length + " bytes are memcached");
            }
        };
        console.log("memcaching data");
        this.client.set(key, data, { flags: 0, exptime: 60*60*3}, callback);
    }

    this.get = function(key, callback) {
        this.client.get(key, function(err, response) {
            if (err) callback(err, null); else {
                callback(null, response[key].buffer);
            }
        });
    }
}
