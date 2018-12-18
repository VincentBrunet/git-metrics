
var core = require("../core");

var bb = require("../bb");

var $local = {};

$local.isCommitHash = function (string) {
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

$local.parseFilePaths = function (filePath) {
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

var $this = {};

$this.parseLogList = function (commitsLines, logs) {
    // Final result of commit data
    var commitsData = [];
    // Take raw logs and split into commits and commit lines
    var commitsBlocks = bb.collection.array.chunks(commitsLines, function (idx, line) {
        return line.startsWith("commit ");
    });
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
            // Linkage
            parents: [],
            refs: [],
            source: "",
            // Commit header
            hash: null,
            date: null,
            author: {
                name: null,
                email: null,
            },
            // Commit contents
            comment: [],
            additions: [],
            deletions: [],
            renames: [],
            changes: [],
            // Misc
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
                var commitLineParts = line.split("\t");
                // Parse hashes and parents
                var commitLineHashes = commitLineParts[0].split(" ");
                commitData.hash = commitLineHashes[1].trim();
                bb.flow.for(commitLineHashes, function (idx, part) {
                    if (idx > 1) {
                        if ($local.isCommitHash(part)) {
                            commitData.parents.push(part);
                        }
                    }
                });
                // Parse source and refs
                var commitLineRefsParts = commitLineParts[1].split("(");
                commitData.source = commitLineRefsParts[0].trim();
                if (commitLineRefsParts.length > 1) {
                    var commitLineRefs = commitLineRefsParts[1].split(")")[0].split(", ");
                    bb.flow.for(commitLineRefs, function (idx, ref) {
                        commitData.refs.push(ref.trim());
                    });
                }
                continue;
            }
            // Author line
            if (line.startsWith("Author:")) {
                var authorLine = line.split("<");
                commitData.author.name = authorLine[0].split("Author:")[1].trim();
                commitData.author.email = authorLine[1].split(">")[0];
                continue;
            }
            // Date line
            if (line.startsWith("Date:")) {
                var dateLine = line.split("Date:");
                commitData.date = bb.moment(dateLine[1].trim());
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
                    commitData.additions.push(bb.string.path.relative(filePath));
                    continue;
                }
                // If its a file deletion event
                if (line.startsWith(" delete mode")) {
                    var filePath = line.substring(20);
                    commitData.deletions.push(bb.string.path.relative(filePath));
                    continue;
                }
                // If its a file change line
                var fileLine = line.split("\t");
                if (fileLine.length >= 3) {
                    // Parse file path
                    var filePaths = $local.parseFilePaths(fileLine[2].trim());
                    // If we have a rename
                    if (filePaths.length > 1) {
                        var renameData = {
                            before: bb.string.path.relative(filePaths[0]),
                            after: bb.string.path.relative(filePaths[1]),
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
                        path: bb.string.path.relative(filePaths[0]),
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
