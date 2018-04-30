
var child_process = require('child_process');
var moment = require("moment");

var gitParse = require("./parse");

var $this = {};

$this.logOnPeriod = function (repository, maxDate, minDate, next) {
    var command = "git log --numstat --full-history --no-merges --no-color --summary";
    command += " --until=" + maxDate.format();
    command += " --since=" + minDate.format();
    var options = {
        cwd: repository,
        maxBuffer: 1024 * 1024 * 1024, // 1 Gb max output
    };
    child_process.exec(command, options, function callback(error, stdout, stderr) {
        if (error == null) {
            return next(true, stdout, null);
        }
        else {
            return next(false, null, error);
        }
    });
};

$this.logOnPastDays = function (repository, maxDate, pastDays, logged, next) {
    if (pastDays <= 0) {
        return next();
    }
    var minDate = moment(maxDate).subtract(1, 'days');
    $this.logOnPeriod(repository, maxDate, minDate, function (success, result, error) {
        if (success) {
            logged(maxDate, minDate, result);
            return $this.logOnPastDays(repository, minDate, pastDays - 1, logged, next);
        } else {
            return next();
        }
    });
};

$this.logCommitsOfPreviousDays = function (repository, days, next) {
    var now = moment();
    var commits = [];
    $this.logOnPastDays(repository, now, days, function (maxDate, minDate, logs) {
        console.log("Parsing logs since", minDate.calendar());
        gitParse.parseLogs(commits, logs);
    }, function () {
        return next(true, commits, null);
    });
};

module.exports = $this;
