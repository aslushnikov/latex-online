/*
 * Wrapping differnt memcached clients
 * */

var nMemcached = require('memcached')

module.exports = function Memcached() {
    this.connect = function() {
        this.memcached = new nMemcached( "localhost:11211", { });
        this.memcached.on( "issue", function( issue ){
            console.log( "Issue occured on server " + issue.server + ", " + issue.retries  + " attempts left untill failure" );
        });

        this.memcached.on( "failure", function( issue ){
            console.log( issue.server + " failed!" );
        });

        this.memcached.on( "reconnecting", function( issue ){
            console.log( "reconnecting to server: " + issue.server + " failed!" );
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
        this.memcached.set(key, data, 60 * 60 * 3, callback);
    }

    this.get = function(key, callback) {
        this.memcached.get(key, callback);
    }
}
