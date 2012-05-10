var Memcached = require('./memcached.js')
  , fs = require('fs')
  , exec  = require('child_process').exec

var memcached = new Memcached();
memcached.connect();

var mockMemcached = {
    store: function(key, data) {
    },
    get: function(key, callback) {
        callback(new Error("Memcached is disabled in the app"));
    }
}

function RequestProcessor(options) {
    var self = this;
    options = options || {};
    options.caching = options.caching || true;
    this.options = options;
    if (options.caching) {
        self.memcached = memcached;
    } else {
        self.memcached= mockMemcached;
    }

    this.fetch = function(options, callback) {
        var cmd = 'bash ';
        if (options.fetchType == "file") {
            cmd += "fetch.sh -f " + options.file;
        } else if (options.fetchType == "url") {
            cmd += "fetch.sh -u " + options.url;
        } else {
            throw new Error("Wrong options passed to fetch: " + JSON.stringify(options));
        }
        exec(cmd, function (error, stdout, stderr) {
            if (error !== null) {
                callback(error);
                return;
            }

            var lines = stdout.split('\n');
            var tmpdir = lines[0];
            var filename = lines[1];
            var md5 = lines[2];
            callback(null, tmpdir, filename, md5);
        });
    }

    this.compile = function (tmpdir, filename, md5, callback) {
        var cmd = 'bash compile.sh ' + filename;
        console.log(cmd);
        exec(cmd, function (error, stdout, stderr) {
            if (error !== null) {
                exec('bash cleanup.sh ' + tmpdir);
                console.error("cmd ERR: " + error);
                error = new Error(error.toString() + "\n" + stderr);
                callback(error);
                return;
            }
            var compiledFileName = stdout.trim();
            console.log("Compiled file saved as: " + compiledFileName);
            fs.readFile(compiledFileName, function(err, data){
                if (err) {
                    console.error("File read error: " + err);
                    exec('bash cleanup.sh ' + tmpdir);
                    callback(err);
                    return;
                }
                console.log("Successfully read " + data.length + " bytes");

                self.memcached.store(md5, data);

                console.log("calling callback");
                callback(null, data);
                console.log("removing file");
                exec('bash cleanup.sh ' + tmpdir);
            });
        });
    }

    this.process = function(callback) {
        this.callback = callback;
        this.fetch(this.options, function(err, tmpdir, filename, md5) {
            if (err)  {
                self.callback(err);
                return;
            }
            console.log("Fetched file saved as " + filename + " with md5 = " + md5);

            self.memcached.get(md5, function(err, result) {
                if (err || !result) {
                    if (err) {
                        console.log("Memcached GET error: " + err);
                    } else {
                        console.error("Memcached doesn't have anything for key = " + md5);
                    }
                    self.compile(tmpdir, filename, md5, self.callback);
                } else {
                    console.log("fetched " + result.length + " bytes from memcache for KEY " + md5);
                    // don't forget to clear the fetched file
                    exec('bash cleanup.sh ' + tmpdir);
                    // call callback
                    self.callback(null, result);
                }
            });
        });
    }
}

function processFile(file, callback) {
    var rp = new RequestProcessor({fetchType: "file", file: file});
    rp.process(callback);
}

function processUrl(url, callback) {
    var rp = new RequestProcessor({fetchType: "url", url: url});
    rp.process(callback);
}

module.exports = {};
module.exports.RequestProcessor = RequestProcessor;
module.exports.processFile = processFile;
module.exports.processUrl = processUrl;
