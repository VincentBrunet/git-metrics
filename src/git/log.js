
var child_process = require('child_process');
var moment = require("moment");

var core = require("../core");

var gitParse = require("./parse");

var $this = {};

$this.logOnPeriod = function (repository, maxDate, minDate, next) {
    var dateFormat = 'MMMM DD YYYY HH:mm:ss ZZ';
    var command = "git log --numstat --full-history --parents --no-color --summary --date=iso";
    command += " --until=\"" + maxDate.format(dateFormat) + "\"";
    command += " --since=\"" + minDate.format(dateFormat) + "\"";
    var options = {
        cwd: repository,
        maxBuffer: 1024 * 1024 * 1024, // 1 Gb max output
    };
    console.log("Reading commits of", maxDate.format("LL"));
    child_process.exec(command, options, function callback(error, stdout, stderr) {
        if (error == null) {
            return next(true, stdout, null);
        }
        else {
            return next(false, null, error);
        }
    });
};

$this.logEachPastDays = function (repository, maxDate, pastDays, pastLines, next) {
    if (pastDays <= 0) {
        return next(true, pastLines);
    }
    var minDate = moment(maxDate).subtract(1, 'days');
    $this.logOnPeriod(repository, maxDate, minDate, function (success, result, error) {
        if (!success) {
            return next(false, pastLines, error);
        }
        else {
            var allLines = result.split(/\r?\n/);
            core.for(allLines, function (idx, line) {
                pastLines.push(line);
            });
            return $this.logEachPastDays(repository, minDate, pastDays - 1, pastLines, next);
        }
    });
};

$this.logsOfPreviousDays = function (repository, days, next) {
    var now = moment();
    $this.logEachPastDays(repository, now, days, [], function (success, commitsLines, error) {
        return next(success, commitsLines, error);
    });
};

module.exports = $this;
