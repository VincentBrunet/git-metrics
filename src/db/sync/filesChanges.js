
var lookup = require("../lookup");

var bb = require("../../bb");

module.exports = async function (context) {
    // List changes to be applied to different paths
    var insertedChanges = [];
    bb.flow.for(context.parsed.commits, function (idx, parsedCommit) {
        // Lookup commit
        var syncedCommit = context.synced.commit[parsedCommit.hash];
        // If we could not find commit
        if (!syncedCommit) {
            console.log("Could not find synced commit", parsedCommit.hash);
            return; // Continue loop
        }
        // Lookup commit author
        var syncedAuthor = context.synced.authors[parsedCommit.author.signature];
        // Could not find author for this commit
        if (!syncedAuthor) {
            console.log("Could not find author", parsedCommit.author);
            return; // Continue loop
        }
        // Loop over all commit changes
        bb.flow.for(parsedCommit.changes, function (idx, parsedChange) {
            // Search over commits to find their file origins
            var commitsChecked = {};
            var commitsToCheck = [syncedCommit];
            while (commitsToCheck.length > 0) {
                // Top-most commit check if the file we are looking for is within created things
                var commitToCheck = commitsToCheck.pop();

                if (commitsChecked[commitToCheck.hash]) {
                    console.log("Checking commit twice", parsedCommit.hash, parsedChange.path, commitToCheck.hash, commitsToCheck.length);
                    //throw new Error("Whatwhat");
                }
                commitsChecked[commitToCheck.hash] = true;


                var fileFound = filesByAddCommitHashAndPath[commitToCheck.hash + "::" + parsedChange.path];
                // Update file record if file was created by this commit
                if (fileFound) {
                    // Insert change datas
                    insertedChanges.push({
                        "git_repo_id": repository.id,
                        "git_commit_id": syncedCommit.id,
                        "git_author_id": syncedAuthor.id,
                        "git_file_id": fileFound.id,
                        "additions": parsedChange.additions,
                        "deletions": parsedChange.deletions,
                        "total": parsedChange.total,
                        "binary": +parsedChange.binary,
                    });
                }
                // If not, check parents
                else {
                    var parentTrees = treesByChildCommitHash[commitToCheck.hash];
                    if (parentTrees) {
                        for (var i = 0; i < parentTrees.length; i++) {
                            var alsoToCheck = commitsByHash[parentTrees[i].parent_git_commit_hash];
                            if (alsoToCheck) {
                                commitsToCheck.push(alsoToCheck);
                            }
                        }
                    }
                }
            }
        });
    });
    // Do insert all changes (ignore already inserted ones)
    await bb.database.insert("git_change", insertedChanges, "ignore");
    // Return inserteds
    return insertedChanges;
};
