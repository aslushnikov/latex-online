var Memcached = require('./memcached.js')
  , fs = require('fs')
  , exec  = require('child_process').exec
  , crypto = require('crypto')

var memcached = new Memcached();
memcached.connect();

var mockMemcached = {
    store: function(key, data, callback) {
        if (callback) {
            callback(new Error("Memcached is OFF"), null);
        }
    },
    get: function(key, callback) {
        callback(new Error({info: "Memcached is disabled in the app"}));
    }
}

function validateOptions(opts) {
    console.log(JSON.stringify(opts));
    if (!opts.entity) {
        throw new Error("No entity is given for processing!");
    }
    if (!opts.type) {
        throw new Error("Type must be declared for processing!");
    }

    if (opts.type != "file" && opts.type != "git" && opts.type != "url" && opts.type != "text") {
        throw new Error("Type must be one of FILE, GIT, URL, TEXT");
    }

    if (opts.type == "url" || opts.type == "text") {
        return;
    }

    if (!opts.target) {
        throw new Error("Target must be specified!");
    }

}

function RequestProcessor(options, callback) {
    var self = this;

    options = options || {};
    options.disableCaching = options.disableCaching || false;
    this.options = options;

    validateOptions(this.options);

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
        var timeout = 1000*60*2;// no more than 2 minutes evaluation
        exec(cmd, {timeout: timeout}, function(error, stdout, stderr) {
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

    this.memcacheGet = function(key, getFailedCallback) {
        self.memcached.get(key, function(err, data) {
            if (err || !data) {
                if (err) {
                    console.log("Memcached GET " + key + " error: " + err.message);
                } else {
                    console.log("Memcached GET " + key + " didn't return any value");
                }
                getFailedCallback();
            } else {
                console.log("fetched " + data.length + " bytes from memcache for KEY " + key);
                self.finishProcessing(null, data);
            }
        });
    }

    this.memcacheStore = function(key, data) {
        self.memcached.store(key, data, function(err, resp) {
            self.finishProcessing(null, data);
            console.log("Memcache store response: " + resp);
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

    this.hashAndGet = function(type, entity, failCallback) {
        self.hashSum(type, entity, function(hash) {
            self.memcacheGet(hash, function() {
                failCallback(hash);
            });
        });
    }

    // Hash for git repository is a combination of SHA of its master branch
    // and target file
    this.hashAndGetGit = function(entity, target, failCallback) {
        self.hashSum("git", entity, function(hash) {
            hash = crypto.createHash('md5').update(hash + target).digest('hex');
            self.memcacheGet(hash, function() {
                failCallback(hash);
            });
        });
    };

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
            self.readFile(compiledFileName, function(data){
                console.log("Successfully read " + data.length + " bytes");
                callback(data);
            });
        });
    }

    this.processUrl = function() {

        function fetchCallback(fetchedFile) {
            self.hashAndGet("file", self.tmpdir + "/" + fetchedFile, function(hash) {
                self.compile(self.tmpdir, fetchedFile, function(data) {
                    self.memcached.store(hash, data, function(err, resp) {
                        self.finishProcessing(null, data);
                        console.log("Memcache store response: " + resp);
                    });
                });
            });
        }

        self.mkTempDir(function(tmpDir) {
            self.tmpdir = tmpDir;
            self.fetch(self.options.type, self.options.entity, fetchCallback);
        });
    }

    this.processText = function() {

      function fetchCallback(fetchedFile) {
          self.hashAndGet("file", self.tmpdir + "/" + fetchedFile, function(hash) {
              self.compile(self.tmpdir, fetchedFile, function(data) {
                  self.memcached.store(hash, data, function(err, resp) {
                      self.finishProcessing(null, data);
                      console.log("Memcache store response: " + resp);
                  });
              });
          });
      }

      self.mkTempDir(function(tmpDir) {
        self.tmpdir = tmpDir;
        var cmd = "cat > " + tmpDir + "/" + "source.tex <<HEREDOC && echo source.tex\n";
        cmd += self.options.entity;
        cmd += "\nHEREDOC";

        self.execShellScript(cmd, fetchCallback);
      });
    }

    this.processFileUpload = function() {

        function fetchCallback() {
            self.compile(self.tmpdir, self.options.target, function(data) {
                self.memcacheStore(self.hash, data);
            });
        }

        function mkTempDirCallback(tmpDir) {
            self.tmpdir = tmpDir;
            self.fetch(self.options.type, self.options.entity, fetchCallback);
        }

        self.hashAndGet("file", self.options.entity, function(hash) {
            self.hash = hash;
            self.mkTempDir(mkTempDirCallback);
        });
    }

    this.processGit = function() {
        function mkTempDirCallback(tmpDir) {
            self.tmpdir = tmpDir;
            self.hashAndGetGit(self.options.entity, self.options.target, hashAndGetCallback);
        }

        function hashAndGetCallback(hash) {
            self.hash = hash;
            self.fetch(self.options.type, self.options.entity, fetchCallback);
        }

        function fetchCallback(gitDir) {
            self.compile(self.tmpdir + "/" + gitDir, self.options.target, function(data) {
                self.memcacheStore(self.hash, data);
            });
        }

        self.mkTempDir(mkTempDirCallback);
    }


    if (self.options.type == "file") {
        self.processFileUpload();
    } else
    if (self.options.type == "url") {
        self.processUrl();
    } else
    if (self.options.type == "git") {
        self.processGit();
    } else
    if (self.options.type == "text") {
        self.processText();
    } else {
        throw new Error("Unknown processing type requested");
    }
}

function processFile(file, target, callback) {
    var rp = new RequestProcessor({
        type: "file",
        entity: file,
        target: target
    }, callback);
    rp.processFileUpload();
}

function processUrl(url, callback) {
    var rp = new RequestProcessor({
        type: "url",
        entity: url
    }
    , callback);
    rp.processUrl();
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
