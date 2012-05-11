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

function RequestProcessor(options, callback) {
    var self = this;

    options = options || {};
    options.caching = options.caching || true;
    this.options = options;
    if (options.caching) {
        self.memcached = memcached;
    } else {
        self.memcached= mockMemcached;
    }
    self.webServiceCallback = callback;

    if (!self.webServiceCallback) {
        throw new Error("Cannot process request without webService callback!");
    }

    this.finishProcessing = function(err, data) {
        self.webServiceCallback(err, data);
        exec('bash cleanup.sh ' + self.tmpdir);
    }

    this.execShellScript = function(cmd, callback) {
        exec(cmd, function(error, stdout, stderr) {
            if (error) {
                console.error("Script '" + cmd + "' exec error: " + stderr);
                self.finishProcessing(new Error(stderr), null);
            } else {
                callback(stdout.trim());
            }
        });
    }

    this.readFile = function(file, callback) {
        fs.readFile(file, function(err, data){
            if (err) {
                console.error("File read error: " + err);
                self.finishProcessing(err, null);
            } else {
                callback(data);
            }
        });
    }

    this.mkTempDir = function(callback) {
        this.execShellScript("bash mkTempDir.sh tmp", callback);
    }

    this.hashSum = function(type, entity, callback) {
        var cmd = "bash hashSum.sh ";
        if (type == "file") {
            cmd += "-f ";
        } else if (type == "git") {
            cmd += "-g ";
        } else {
            throw new Error("Unknown type for hashSum: " + type);
        }
        cmd += entity;
        this.execShellScript(cmd, callback);
    }

    this.fetch = function(type, entity, callback) {
        var cmd = 'bash fetch.sh ' + self.tmpdir + " ";
        if (type == "file") {
            cmd += "-f ";
        } else if (type == "url") {
            cmd += "-u ";
        } else {
            throw new Error("Wrong options passed to fetch: " + JSON.stringify(options));
        }
        cmd += entity;

        this.execShellScript(cmd, callback);
    }

    this.compile = function (target,callback) {
        var cmd = 'bash compile.sh ' + self.tmpdir + ' ' + target;
        this.execShellScript(cmd, function (compiledFileName) {
            console.log("Compiled file saved as: " + compiledFileName);
            self.readFile(compiledFileName, function(data){
                console.log("Successfully read " + data.length + " bytes");
                self.finishProcessing(null, data);
                callback(data);
            });
        });
    }

    this.process = function() {

        function mkTempDirCallback(tmpDir) {
            self.tmpdir = tmpDir;
            self.fetch(self.options.type, self.options.entity, fetchCallback);
        }

        function fetchCallback(fetchedFile) {
            self.hashSum("file", fetchedFile, function(hash) {
                console.log('Hash sum for ' + fetchedFile + ' = ' + hash);
                self.memcached.get(hash, function(err, data) {
                    if (err || !data) {
                        if (err) {
                            console.log("Memcached GET error: " + JSON.stringify(err));
                        }
                        self.compile(fetchedFile, function(data) {
                            self.memcached.store(hash, data);
                        });
                    } else {
                        console.log("fetched " + data.length + " bytes from memcache for KEY " + hash);
                        self.finishProcessing(null, data);
                    }
                });
            });
        }

        self.mkTempDir(mkTempDirCallback);
    }

}

function processFile(file, callback) {
    var rp = new RequestProcessor({
        type: "file",
        entity: file
    }, callback);
    rp.process();
}

function processUrl(url, callback) {
    var rp = new RequestProcessor({
        type: "url",
        entity: url
    }
    , callback);
    rp.process();
}

function processGit(git, target, callback) {
    var rp = new RequestProcessor({
        type: "url",
        entity: url
    }, callback);
    rp.process(callback);
}

module.exports = {};
module.exports.RequestProcessor = RequestProcessor;
module.exports.processFile = processFile;
module.exports.processUrl = processUrl;
