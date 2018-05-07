
var child_process = require('child_process');

var gitParse = require("./parse");

var $this = {};

$this.currentRepo = function (repository, next) {
    var command = "git config --get remote.origin.url";
    var options = {
        cwd: repository,
        maxBuffer: 1024 * 1024 * 1024, // 1 Gb max output
    };
    child_process.exec(command, options, function callback(error, stdout, stderr) {
        if (error == null) {
            return next(true, stdout.trim(), null);
        }
        else {
            return next(false, null, error);
        }
    });
};

module.exports = $this;
