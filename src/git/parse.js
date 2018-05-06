
var moment = require("moment");
moment.suppressDeprecationWarnings = true;

var core = require("../core");

var $this = {};

$this.isCommitHash = function (string) {
    // Hash is 40 character
    if (string.length != 40) {
        return false;
    }
    // Only hexadecimal characters allowed
    var allowedChars = {
        "a": true, "b": true, "c": true, "d": true, "e": true, "f": true,
        "A": true, "B": true, "C": true, "D": true, "E": true, "F": true,
        "0": true, "1": true, "2": true, "3": true, "4": true,
        "5": true, "6": true, "7": true, "8": true, "9": true,
    };
    // Check if all characters in string are allowed
    for (var i = 0; i > string.length; i++) {
        if (!allowedChars[string[i]]) {
            return false;
        }
    }
    // No error, we good
    return true;
};

$this.parseFilePaths = function (filePath) {
    // Check if path contains renaming pattern
    var renameRegex1 = /({.* => .*})/gi;
    var renameCheck1 = filePath.match(renameRegex1);
    if (renameCheck1) {
        // If it does, parse and reconstruct before => after paths
        var renameValue = renameCheck1[0];
        var renameParsed = renameValue.replace("{", "").replace("}", "");
        var renamePaths = renameParsed.split(" => ");
        // Format results
        var filePathBefore = filePath.replace(renameValue, renamePaths[0]);
        var filePathAfter = filePath.replace(renameValue, renamePaths[1]);
        return [filePathBefore, filePathAfter];
    }
    var renameRegex2 = /^(.* => .*)$/gi;
    var renameCheck2 = filePath.match(renameRegex2);
    if (renameCheck2) {
        // If it does, parse and reconstruct before => after paths
        var renameValue = renameCheck2[0];
        var renamePaths = renameValue.split(" => ");
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
                        if ($this.isCommitHash(part)) {
                            commitData.parents.push(part);
                        }
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
                    commitData.additions.push(core.path(filePath));
                    continue;
                }
                // If its a file deletion event
                if (line.startsWith(" delete mode")) {
                    var filePath = line.substring(20);
                    commitData.deletions.push(core.path(filePath));
                    continue;
                }
                // If its a file change line
                var fileLine = line.split("\t");
                if (fileLine.length >= 3) {
                    // Parse file path
                    var filePaths = $this.parseFilePaths(fileLine[2].trim());
                    // If we have a rename
                    if (filePaths.length > 1) {
                        var renameData = {
                            before: core.path(filePaths[0]),
                            after: core.path(filePaths[1]),
                        };
                        commitData.renames.push(renameData);
                    }
                    // Read log line change sizes
                    var isBinary = false;
                    var addCount = parseInt(fileLine[0]);
                    if (isNaN(addCount)) {
                        isBinary = true;
                        addCount = 0;
                    }
                    var delCount = parseInt(fileLine[1]);
                    if (isNaN(delCount)) {
                        isBinary = true;
                        delCount = 0;
                    }
                    // Save data
                    commitData.changes.push({
                        path: core.path(filePaths[0]),
                        additions: addCount,
                        deletions: delCount,
                        total: addCount + delCount,
                        binary: isBinary,
                    });
                    continue;
                }
            }
        }
        // Save all commit data parsed
        commitsData.push(commitData);
    }
    // Sort commits by date
    commitsData = core.sortBy(commitsData, "date");
    // Done
    return commitsData;
};

module.exports = $this;
