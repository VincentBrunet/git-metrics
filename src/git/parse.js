
var moment = require("moment");
moment.suppressDeprecationWarnings = true;

var core = require("../core");

var $this = {};

$this.parseFilePaths = function (filePath) {
    // Check if path contains renaming pattern
    var renameRegex = /({.* => .*})/gi;
    var renameCheck = filePath.match(renameRegex);
    if (renameCheck) {
        // If it does, parse and reconstruct before => after paths
        var renameValue = renameCheck[0];
        var renameParsed = renameValue.replace("{", "").replace("}", "");
        var renamePaths = renameParsed.split(" => ");
        // Format results
        var filePathBefore = filePath.replace(renameValue, renamePaths[0]);
        var filePathAfter = filePath.replace(renameValue, renamePaths[1]);
        return [filePathBefore, filePathAfter];
    }
    // If its just a regular file path
    return [filePath];
};

$this.parseLogList = function (commitsLines, logs) {
    // Take raw logs and split into commits and commit lines
    var commitsData = [];
    var commitsBlocks = [];
    var currentCommitLines = null;
    // For every log line
    for (var i = 0; i < commitsLines.length; i++) {
        // Current log line
        var currentLine = commitsLines[i];
        // If we have a new commit
        if (currentLine.startsWith("commit ")) {
            // Save and reset current commit
            if (currentCommitLines) {
                commitsBlocks.push(currentCommitLines);
            }
            currentCommitLines = [];
        }
        // If its a normal line, continue saving line
        if (currentCommitLines) {
            currentCommitLines.push(currentLine);
        }
    }
    // Add final block
    if (currentCommitLines && currentCommitLines.length > 0) {
        commitsBlocks.push(currentCommitLines);
    }
    // For every commits
    for (var i = 0; i < commitsBlocks.length; i++) {
        // Get lines of commit
        var lines = commitsBlocks[i];
        // Commit must be at least 3 lines
        if (lines.length < 3) {
            console.log("Invalid commit", lines.length, lines);
        }
        // Commit datas
        var commitData = {
            parents: [],
            hash: null,
            author: null,
            date: null,
            comment: [],
            additions: [],
            deletions: [],
            renames: [],
            changes: [],
            raw: lines,
        };
        // Parsing states
        var headerPassed = false;
        var commentPassed = false;
        // Loop over every commit line
        for (var j = 0; j < lines.length; j++) {
            // Current commit line
            var line = lines[j];
            // Commit hash line
            if (line.startsWith("commit ")) {
                var commitLine = line.split(" ");
                commitData.hash = commitLine[1].trim();
                core.for(commitLine, function (idx, part) {
                    if (idx > 1) {
                        commitData.parents.push(part);
                    }
                });
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
                // If its a file creation event
                if (line.startsWith(" create mode")) {
                    var filePath = line.substring(20);
                    commitData.additions.push(filePath);
                    continue;
                }
                // If its a file deletion event
                if (line.startsWith(" delete mode")) {
                    var filePath = line.substring(20);
                    commitData.deletions.push(filePath);
                    continue;
                }
                // If its a file change line
                var fileLine = line.split("\t");
                if (fileLine.length >= 3) {
                    // If its NOT a binary change
                    if (fileLine[0] != "-" && fileLine[1] != "-") {
                        // Read file path and change counts
                        var changeData = {
                            path: null,
                            deletions: 0,
                            additions: 0,
                            total: 0,
                        };
                        // Read log line content
                        var filePaths = $this.parseFilePaths(fileLine[2].trim());
                        var addCount = parseInt(fileLine[0]);
                        var delCount = parseInt(fileLine[1]);
                        var changeCount = addCount + delCount;
                        // If we have a rename
                        if (filePaths.length > 1) {
                            var renameData = {
                                before: filePaths[0],
                                after: filePaths[1],
                            };
                            commitData.renames.push(renameData);
                        }
                        // Save data
                        changeData.path = filePaths[0];
                        changeData.additions = addCount;
                        changeData.deletions = delCount;
                        changeData.total = changeCount;
                        commitData.changes.push(changeData);
                    }
                    continue;
                }
            }
        }
        // Save all commit data parsed
        commitsData.push(commitData);
    }
    return commitsData;
};

module.exports = $this;
