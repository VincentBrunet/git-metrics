
var bb = require("../../bb");

var thisHash = require("./hash");
var thisPaths = require("./paths");

module.exports = function (history) {
    // Final result of commit data
    var commitsData = [];
    // Take raw logs and split into commits and commit lines
    var commitsLines = bb.array.chunks(history, function (idx, line) {
        return line.startsWith("commit ");
    });
    // For every commits
    for (var i = 0; i < commitsLines.length; i++) {
        // Get lines of commit
        var lines = commitsLines[i];
        // Commit must be at least 3 lines
        if (lines.length < 3) {
            console.log("Invalid commit", lines.length, lines);
        }
        // Commit datas
        var commitData = {
            // Linkage
            trees: [],
            refs: [],
            source: "",
            // Commit header
            hash: null,
            date: null,
            author: {
                signature: null,
                name: null,
                email: null,
            },
            // Commit contents
            comment: [],
            creations: [],
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
                        if (thisHash(part)) {
                            commitData.trees.push(part);
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
                commitData.author.signature = line.split("Author:")[1].trim();
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
                    commitData.creations.push(bb.string.path.relative(filePath));
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
                    var filePaths = thisPaths(fileLine[2].trim());
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
                    var insertCount = parseInt(fileLine[0]);
                    if (isNaN(insertCount)) {
                        isBinary = true;
                        insertCount = 0;
                    }
                    var removeCount = parseInt(fileLine[1]);
                    if (isNaN(removeCount)) {
                        isBinary = true;
                        removeCount = 0;
                    }
                    // Save data
                    commitData.changes.push({
                        path: bb.string.path.relative(filePaths[0]),
                        insert: insertCount,
                        remove: removeCount,
                        total: insertCount + removeCount,
                        binary: isBinary,
                    });
                    continue;
                }
            }
        }
        // Save all commit data parsed, if commit is valid
        if (commitData.hash != null) {
            commitsData.push(commitData);
        }
    }
    // Sort commits by date
    commitsData = bb.array.sortBy(commitsData, "date");
    // Done
    return commitsData;
};
