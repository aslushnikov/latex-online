var Memcached = require('./memcached.js')
  , fs = require('fs')
  , exec  = require('child_process').exec
  , CACHING = true;

var memcached = new Memcached();


function generate(url, callback) {
    var cmd = 'cd tmp && sh compile.sh ' + url;
    console.log(cmd);
    exec(cmd, function (error, stdout, stderr) {
        if (error !== null) {
            console.error("cmd ERR: " + error);
            callback(error);
            return;
        }
        var fileName = "./tmp/" + stdout.trim();
        console.log("reading file " + fileName);
        fs.readFile(fileName, function(err, data){
            if (err) {
                console.error("File read error: " + err);
                callback(err);
                return;
            }
            console.log("Successfully read " + data.length + " bytes");
            if (CACHING) {
                memcached.store(encodeURIComponent(url), data);
            }
            console.log("calling callback");
            callback(null, data);
            console.log("removing file");
            fs.unlink(fileName);
        });
    });
}

function get(url, callback) {
    if (!CACHING) {
        console.log("Caching is OFF, generating");
        generate(url, callback);
        return;
    }

    var key = encodeURIComponent(url);
    memcached.get(key, function(err, result) {
        if (err || !result) {
            console.log("memcache doesn't have anything for KEY " + key);
            generate(url, callback);
        } else {
            console.log("fetched " + result.length + " bytes from memcache for KEY " + key);
            callback(null, result);
        }
    });
}

module.exports = function(caching) {
    CACHING = caching;
    if (CACHING) {
        memcached.connect();
    }
    return get;
}
