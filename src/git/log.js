
var child_process = require('child_process');
var moment = require("moment");

var gitParse = require("./parse");

var $this = {};

$this.logsOnPeriod = function (repository, maxDate, minDate, next) {
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

$this.logsOnPastDays = function (repository, maxDate, pastDays, logged, next) {
    if (pastDays <= 0) {
        return next();
    }
    var minDate = moment(maxDate).subtract(1, 'days');
    $this.logsOnPeriod(repository, maxDate, minDate, function (success, result, error) {
        if (success) {
            logged(maxDate, minDate, result);
            return $this.logsOnPastDays(repository, minDate, pastDays - 1, logged, next);
        } else {
            return next();
        }
    });
};

$this.orderedStatsDict = function (dict) {
    var ordered = [];
    for (var key in dict) {
        if (dict.hasOwnProperty(key)) {
            var value = dict[key];
            ordered.push([key, value]);
        }
    }
    ordered.sort(function(a, b) {
        return b[1] - a[1]
    });
    return ordered;
};

$this.run = function (repository, days, next) {
    var now = moment();
    var commits = [];
    $this.logsOnPastDays(repository, now, days, function (maxDate, minDate, logs) {
        console.log("Parsing logs since", minDate.calendar());
        gitParse.parseLogs(commits, logs);
    }, function () {
        return next(true, commits, null);
        /*
        var commitsPerAuthor = {};
        var commitsPerDay = {};
        var changesPerAuthor = {};
        var additionPerAuthor = {};
        var deletionsPerAuthor = {};
        var filesPerAuthor = {};
        var changesPerAuthorCode = {};
        var additionPerAuthorCode = {};
        var deletionsPerAuthorCode = {};
        var filesPerAuthorCode = {};
        for (var i = 0; i < commits.length; i++) {
            var commit = commits[i];
            if (commit.author) {
                var author = commit.author;
                commitsPerAuthor[author] = (commitsPerAuthor[author] || 0) + 1;
                for (var j = 0; j < commit.changes.length; j++) {
                    var change = commit.changes[j];
                    changesPerAuthor[author] = (changesPerAuthor[author] || 0) + change.total;
                    additionPerAuthor[author] = (additionPerAuthor[author] || 0) + change.additions;
                    deletionsPerAuthor[author] = (deletionsPerAuthor[author] || 0) + change.deletions;
                    filesPerAuthor[author] = (filesPerAuthor[author] || 0) + 1;
                    if (change.path.endsWith(".cs"))
                    {
                        changesPerAuthorCode[author] = (changesPerAuthorCode[author] || 0) + change.total;
                        additionPerAuthorCode[author] = (additionPerAuthorCode[author] || 0) + change.additions;
                        deletionsPerAuthorCode[author] = (deletionsPerAuthorCode[author] || 0) + change.deletions;
                        filesPerAuthorCode[author] = (filesPerAuthorCode[author] || 0) + 1;
                    }
                }
            }
            else {
                console.log("Invalid author", commit.author, commit.raw);
            }
            if (commit.date) {
                var day = commit.date.format('L');
                commitsPerDay[day] = (commitsPerDay[day] || 0) + 1;
            }
            else {
                console.log("Invalid date", commit.date, commit.raw);
            }
        }
        console.log("Log done", commits.length);
        console.log("Commits per author", $this.orderedStatsDict(commitsPerAuthor));
        console.log("Commits per day", $this.orderedStatsDict(commitsPerDay));
        console.log("Changes per author", $this.orderedStatsDict(changesPerAuthor));
        console.log("Additions per author", $this.orderedStatsDict(additionPerAuthor));
        console.log("Deletions per author", $this.orderedStatsDict(deletionsPerAuthor));
        console.log("Files per author", $this.orderedStatsDict(filesPerAuthor));
        console.log("Changes per author (.cs)", $this.orderedStatsDict(changesPerAuthorCode));
        console.log("Additions per author (.cs)", $this.orderedStatsDict(additionPerAuthorCode));
        console.log("Deletions per author (.cs)", $this.orderedStatsDict(deletionsPerAuthorCode));
        console.log("Files per author (.cs)", $this.orderedStatsDict(filesPerAuthorCode));
        return next();
        */
    });
};

module.exports = $this;
