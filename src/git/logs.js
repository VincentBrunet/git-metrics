
var child_process = require('child_process');
var moment = require("moment");

var $module = {};

$module.logsOnPeriod = function (repository, maxDate, minDate, next) {
    var command = "git log --stat=1000000000 --full-history --no-merges --no-color";
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

$module.logsUntilFail = function (repository, maxDate, maxDays, logged, next) {
    if (maxDays <= 0) {
        return next();
    }
    var minDate = moment(maxDate).subtract(1, 'days');
    $module.logsOnPeriod(repository, maxDate, minDate, function (success, result, error) {
        if (success) {
            logged(maxDate, minDate, result);
            return $module.logsUntilFail(repository, minDate, maxDays - 1, logged, next);
        } else {
            return next();
        }
    });
};

$module.parseLogs = function (commitsData, logs) {
    var allLines = logs.split(/\r?\n/);
    var commitsLines = [];
    var currentCommitLines = null;
    for (var i = 0; i < allLines.length; i++) {
        var currentLine = allLines[i];
        if (currentLine.startsWith("commit ")) {
            if (currentCommitLines) {
                commitsLines.push(currentCommitLines);
            }
            currentCommitLines = [];
        }
        if (currentCommitLines) {
            currentCommitLines.push(currentLine);
        }
    }

    for (var i = 0; i < commitsLines.length; i++) {
        var lines = commitsLines[i];
        //console.log("Commit Splitted", lines);

        if (lines.length > 3) {

            var commitData = {
                hash: null,
                author: null,
                comment: [],
                date: null,
                changes: [],
                renames: [],
                raw: lines,
            };

            var headerPassed = false;
            var commentPassed = false;

            for (var j = 0; j < lines.length; j++) {

                var line = lines[j];

                // Commit hash line
                if (line.startsWith("commit ")) {
                    var commitLine = line.split(" ");
                    commitData.hash = commitLine[1].trim();
                    continue;
                }
                // Author line
                if (line.startsWith("Author:")) {
                    var authorLine = line.split("<");
                    commitData.author = authorLine[authorLine.length - 1].replace(">", "");
                    continue;
                }

                // Date line
                if (line.startsWith("Date:")) {
                    var dateLine = line.split("Date:");
                    commitData.date = moment(dateLine[1].trim());
                    continue;
                }

                // Empty line
                if (line.length <= 0) {
                    if (!headerPassed) {
                        headerPassed = true;
                        continue;
                    }
                    if (!commentPassed) {
                        commentPassed = true;
                        continue;
                    }
                }

                // Comment lines
                if (headerPassed && !commentPassed) {
                    commitData.comment.push(line.trim());
                    continue;
                }

                // File changes lines
                if (headerPassed && commentPassed) {
                    // If its a change line
                    var fileLine = line.split("|");
                    if (fileLine.length > 1) {
                        // Read file path and change counts
                        var changeData = {
                            path: null,
                            deletions: 0,
                            additions: 0,
                            total: 0,
                        };
                        var filePath = fileLine[0].trim();
                        var changes = fileLine[1].trim().split(" ");
                        var changeCount = parseInt(changes[0]);
                        var addCount = 0;
                        var delCount = 0;
                        if (changeCount > 0) {
                            var changeStr = changes[1];
                            if (changeStr) {
                                var tickCount = 0;
                                for (var k = 0; k < changeStr.length; k++) {
                                    var changeType = changeStr[k];
                                    if (changeType == "+") {
                                        addCount++;
                                        tickCount++;
                                    }
                                    if (changeType == "-") {
                                        delCount++;
                                        tickCount++;
                                    }
                                }
                                var addRatio = addCount / tickCount;
                                var delRatio = delCount / tickCount;
                                addCount = addRatio * changeCount;
                                delCount = delRatio * changeCount;
                            }
                            else {
                                addCount = 0;
                                delCount = changeCount;
                            }
                        }
                        // If it is a renamed file
                        var renameRegex = /({.* => .*})/gi;
                        var renameCheck = filePath.match(renameRegex);
                        if (renameCheck) {
                            var renameValue = renameCheck[0];
                            var renameParsed = renameValue.replace("{", "").replace("}", "");
                            var renamePaths = renameParsed.split(" => ");
                            var filePathBefore = filePath.replace(renameValue, renamePaths[0]);
                            var filePathAfter = filePath.replace(renameValue, renamePaths[1]);
                            filePath = filePathBefore;
                            var renameData = {
                                before: filePathBefore,
                                after: filePathAfter,
                            };
                            commitData.renames.push(renameData);
                        }
                        // If its a text file with trackable change counts
                        if (!isNaN(changeCount)) {
                            changeData.path = filePath;
                            changeData.additions = addCount;
                            changeData.deletions = delCount;
                            changeData.total = changeCount;
                            commitData.changes.push(changeData);
                        }
                    }
                    continue;
                }

            }

            //console.log("Commit parsed", commitData);
            commitsData.push(commitData);
        }


        // Parse commit id

    }
};

$module.run = function (repository, next) {
    var now = moment();
    var commits = [];
    $module.logsUntilFail(repository, now, 50, function (maxDate, minDate, logs) {
        console.log("Parsing logs since", minDate.calendar());
        $module.parseLogs(commits, logs);
    }, function () {
        var commitsPerAuthor = {};
        var commitsPerDay = {};
        var changesPerAuthor = {};
        var additionPerAuthor = {};
        var deletionsPerAuthor = {};
        var filesPerAuthor = {};
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
        console.log("Commits per author", commitsPerAuthor);
        console.log("Commits per day", commitsPerDay);
        console.log("Changes per author", changesPerAuthor);
        console.log("Additions per author", additionPerAuthor);
        console.log("Deletions per author", deletionsPerAuthor);
        console.log("Files per author", filesPerAuthor);
        return next();
    });
};

module.exports = $module;
