/*
 * Wrapping differnt memcached clients
 * */

var mc = require('mc');

module.exports = function Memcached() {
    this.client = new mc.Client("localhost", mc.Adapter.raw);
    this.connect = function(callback) {
        this.client.connect(function() {
              console.log("Connected to the localhost memcache on port 11211!");
              if (callback) callback();
        });
    }

    this.store = function(key, data, callback) {
        callback = callback || function(error, result) {
            if (error) {
                console.error("Erros:" + error.message + " " + JSON.stringify(error));
            } else {
                console.log("Memcached response: " + result);
            }
        };
        this.client.set(key, data, { flags: 0, exptime: 60*60*3}, callback);
    }

    this.get = function(key, callback) {
        this.client.get(key, function(err, response) {
            if (err) callback(err, null); else {
                callback(null, response[key].buffer);
            }
        });
    }

    this.stats = function(cmd, callback) {
        if (typeof(cmd) === 'function') {
            callback = cmd;
            cmd = null;
        }
        if (cmd) {
            this.client.stats(cmd, callback);
        } else {
            this.client.stats(callback);
        }
    }

    this.disconnect = function() {
        this.client.disconnect();
    }
}
