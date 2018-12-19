
var lookup = require("../lookup");

var bb = require("../../bb");

module.exports = async function (repository, authorsBySignatures, commitsByHash, treesByChildCommitHash, commitsList) {
    // List file changes paths found
    var commitsChangesPaths = {};
    bb.flow.for(commitsList, function (idx, commit) {
        bb.flow.for(commit.changes, function (idx, change) {
            commitsChangesPaths[change.path] = true;
        });
    });
    // Lookup all files changed
    var files = await lookup.files.byPaths(repository.id, bb.dict.keys(commitsChangesPaths));
    // Index files by commit hash and path
    var filesByAddCommitHashAndPath = bb.array.indexBy(files, function (file) {
        return file.add_git_commit_hash + "::" + file.path;
    });
    // List changes to be applied to different paths
    var insertedChanges = [];
    bb.flow.for(commitsList, function (idx, commit) {
        // Lookup parent commit
        var parentCommit = commitsByHash[commit.hash];
        // If we could not find parent commit
        if (!parentCommit) {
            console.log("Could not find parent commit", commit.hash);
            return; // Continue loop
        }
        // Lookup commit author
        var author = authorsBySignatures[commit.author.signature];
        // Could not find author for this commit
        if (!author) {
            console.log("Could not find author", commit.author);
            return; // Continue loop
        }
        // Loop over all commit changes
        bb.flow.for(commit.changes, function (idx, change) {
            // Search over commits to find their file origins
            var commitsChecked = {};
            var commitsToCheck = [parentCommit];
            while (commitsToCheck.length > 0) {
                // Top-most commit check if the file we are looking for is within created things
                var commitToCheck = commitsToCheck.pop();

                if (commitsChecked[commitToCheck.hash]) {
                    console.log("Checking commit twice", commit.hash, change.path, commitToCheck.hash, commitsToCheck.length);
                    //throw new Error("Whatwhat");
                }
                commitsChecked[commitToCheck.hash] = true;


                var fileFound = filesByAddCommitHashAndPath[commitToCheck.hash + "::" + change.path];
                // Update file record if file was created by this commit
                if (fileFound) {
                    // Insert change datas
                    insertedChanges.push({
                        "git_repo_id": repository.id,
                        "git_commit_id": parentCommit.id,
                        "git_author_id": author.id,
                        "git_file_id": fileFound.id,
                        "additions": change.additions,
                        "deletions": change.deletions,
                        "changes": change.total,
                        "binary": +change.binary,
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
