/*
 * Run this script to get statistics about local memcached instance
 * */
var Memcached = require('./memcached.js');
var memcached = new Memcached();

memcached.connect(function() {
    memcached.stats(function(err, stats) {
        if (err) console.error(err); else console.log(stats);
        memcached.disconnect();
    });
});
