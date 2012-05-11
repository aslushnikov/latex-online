var Memcached = require('./memcached.js')
  , fs = require('fs')
  , exec  = require('child_process').exec

var memcached = new Memcached();
memcached.connect();

var mockMemcached = {
    store: function(key, data) {
    },
    get: function(key, callback) {
        callback(new Error({info: "Memcached is disabled in the app"}));
    }
}

function RequestProcessor(options, callback) {
    var self = this;

    options = options || {};
    options.disableCaching = options.disableCaching || false;
    this.options = options;
    if (!options.disableCaching) {
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
        exec('bash shells/cleanup.sh ' + self.tmpdir);
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
        this.execShellScript("bash shells/mkTempDir.sh tmp", callback);
    }

    this.hashSum = function(type, entity, callback) {
        var cmd = "bash shells/hashSum.sh ";
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
        var cmd = 'bash shells/fetch.sh ' + self.tmpdir + " ";
        if (type == "file") {
            cmd += "-f ";
        } else if (type == "url") {
            cmd += "-u ";
        } else if (type == "git") {
            cmd += "-g ";
        } else {
            throw new Error("Wrong options passed to fetch: " + JSON.stringify(options));
        }
        cmd += entity;

        this.execShellScript(cmd, callback);
    }

    this.compile = function (rootdir, target,callback) {
        var cmd = 'bash shells/compile.sh ' + rootdir + ' ' + target;
        this.execShellScript(cmd, function (compiledFileName) {
            console.log("Compiled file saved as: " + compiledFileName);
            console.log("END");
            self.readFile(compiledFileName, function(data){
                console.log("Successfully read " + data.length + " bytes");
                self.finishProcessing(null, data);
                callback(data);
            });
        });
    }

    this.process = function(target) {
        function mkTempDirCallback(tmpDir) {
            self.tmpdir = tmpDir;
            self.fetch(self.options.type, self.options.entity, fetchCallback);
        }

        function fetchCallback(fetchedFile) {
            target = target || fetchedFile;
            self.hashSum("file", self.tmpdir + "/" + target, function(hash) {
                console.log('Hash sum for ' + target + ' = ' + hash);
                self.memcached.get(hash, function(err, data) {
                    if (err || !data) {
                        if (err) {
                            console.log("Memcached GET error: " + err.message);
                        }
                        self.compile(self.tmpdir, target, function(data) {
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

    this.processGit = function() {
        function mkTempDirCallback(tmpDir) {
            self.tmpdir = tmpDir;
            self.hashSum("git", self.options.entity, hashSumCallback);
        }

        function hashSumCallback(hash) {
            console.log('Hash sum for ' + self.options.entity + ' = ' + hash);
            self.hashSum = hash;
            self.memcached.get(hash, function(err, data) {
                if (err || !data) {
                    if (err) {
                        console.log("Memcached GET error: " + err.message);
                    }
                    self.fetch(self.options.type, self.options.entity, fetchCallback);
                } else {
                    console.log("fetched " + data.length + " bytes from memcache for KEY " + hash);
                    self.finishProcessing(null, data);
                }
            });
        }

        function fetchCallback(gitDir) {
            self.compile(self.tmpdir + "/" + gitDir, self.options.target, function(data) {
                self.memcached.store(self.hashSum, data);
            });
        }

        self.mkTempDir(mkTempDirCallback);
    }
}

function processFile(file, target, callback) {
    var rp = new RequestProcessor({
        type: "file",
        entity: file
    }, callback);
    rp.process(target);
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
        type: "git",
        entity: git,
        target: target
    }, callback);
    rp.processGit();
}

module.exports = {};
module.exports.RequestProcessor = RequestProcessor;
module.exports.processFile = processFile;
module.exports.processUrl = processUrl;
module.exports.processGit = processGit;
