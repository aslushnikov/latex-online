var Memcached = require('./memcached.js')
  , fs = require('fs')
  , exec  = require('child_process').exec
  , CACHING = true;

var memcached = new Memcached();

function fetch(url, callback) {
    var cmd = 'sh fetch.sh ' + url;
    exec(cmd, function (error, stdout, stderr) {
        if (error !== null) {
            console.error("cmd ERR: " + error);
            callback(error);
            return;
        }
        var filename = stdout.split('\n')[0];
        var md5 = stdout.split('\n')[1];
        callback(null, filename, md5);
    });
}

function generate(filename, md5, callback) {
    var cmd = 'sh compile.sh ' + filename;
    console.log(cmd);
    exec(cmd, function (error, stdout, stderr) {
        if (error !== null) {
            console.error("cmd ERR: " + error);
            callback(error);
            return;
        }
        var newFileName = './tmp/' + stdout.trim();
        console.log("Compiled file saved as: " + newFileName);
        fs.readFile(newFileName, function(err, data){
            if (err) {
                console.error("File read error: " + err);
                callback(err);
                return;
            }
            console.log("Successfully read " + data.length + " bytes");
            if (CACHING) {
                memcached.store(md5, data);
            }
            console.log("calling callback");
            callback(null, data);
            console.log("removing file");
            fs.unlink(newFileName);
        });
    });
}

function get(url, callback) {
    fetch(url, function(err, filename, md5) {
        console.log("Fetched file saved as " + filename + " with md5 = " + md5);
        if (err) throw err;

        if (!CACHING) {
            console.log("Caching is OFF, generating");
            generate(filename, md5, callback);
            return;
        }

        memcached.get(md5, function(err, result) {
            if (err || !result) {
                console.log("memcache doesn't have anything for KEY " + md5);
                generate(filename, md5, callback);
            } else {
                console.log("fetched " + result.length + " bytes from memcache for KEY " + md5);
                callback(null, result);
            }
        });
    });
}

module.exports = function(caching) {
    CACHING = caching;
    if (CACHING) {
        memcached.connect();
    }
    return get;
}
