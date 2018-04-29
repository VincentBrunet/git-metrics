
var child_process = require('child_process');
var moment = require("moment");

var $module = {};

$module.logsOnPeriod = function (repository, maxDate, minDate, next) {
    var command = "git log --stat --full-history";
    command += " --until=" + maxDate.format();
    command += " --since=" + minDate.format();
    var options = {
        cwd: repository,
        maxBuffer: 1024 * 1024 * 1024, // 1 Gb max output
    };
    child_process.exec(command, options, function callback(error, stdout, stderr) {
        if (error == null) {
            return next(true, stdout, stderr);
        }
        else {
            return next(false, stdout, error);
        }
    });
};

$module.logsUntilFail = function (repository, maxDate, logged, next) {
    var minDate = moment(maxDate).subtract(1, 'days');
    $module.logsOnPeriod(repository, maxDate, minDate, function (success, result, error) {
        if (success) {
            logged(maxDate, minDate, result);
            return $module.logsUntilFail(repository, minDate, logged, next);
        } else {
            return next();
        }
    });
};

$module.run = function (repository, next) {
    var now = moment();
    $module.logsUntilFail(repository, now, function (maxDate, minDate, logs) {
        console.log("Log found", maxDate.calendar(), minDate.calendar(), logs.length);
    }, function () {
        console.log("Log done");
        return next();
    });
};

module.exports = $module;
