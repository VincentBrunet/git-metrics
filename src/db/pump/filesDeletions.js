
var lookup = require("../lookup");

var bb = require("../../bb");

module.exports = async function (repository, commitsByHash, treesByChildCommitHash, commitsList) {
    // List all files found for mark as deleted
    var commitsFilesDeletions = {};
    bb.flow.for(commitsList, function (idx, commit) {
        bb.flow.for(commit.deletions, function (idx, deletion) {
            commitsFilesDeletions[deletion] = true;
        });
        bb.flow.for(commit.renames, function (idx, rename) {
            commitsFilesDeletions[rename.before] = true;
        });
    });
    // Lookup all files deleteds
    var files = await lookup.files.byPaths(repository.id, bb.dict.keys(commitsFilesDeletions));
    // Index files by commit hash and path
    var filesByAddCommitHashAndPath = bb.array.indexBy(files, function (file) {
        return file.add_git_commit_hash + "::" + file.path;
    });
    // List file updates to be applied
    var filesDeletedByCommitId = {};
    bb.flow.for(commitsList, function (idx, commit) {
        // Lookup parent commit
        var parentCommit = commitsByHash[commit.hash];
        // If parent commit not found
        if (!parentCommit) {
            console.log("Could not find parent commit", commit.hash);
            return; // Continue loop
        }
        // List all paths to be marked as deleted
        var commitDeletions = [];
        bb.flow.for(commit.deletions, function (idx, deletion) {
            commitDeletions.push(deletion);
        });
        bb.flow.for(commit.renames, function (idx, rename) {
            commitDeletions.push(rename.before);
        });
        // For every deleted paths, lookup their associated files
        bb.flow.for(commitDeletions, function (idx, deletion) {
            // Search over commits to find their file origins
            var commitsToCheck = [parentCommit];
            while (commitsToCheck.length > 0) {
                // Top-most commit check if the file we are looking for is within created things
                var commitToCheck = commitsToCheck.pop();
                var fileFound = filesByAddCommitHashAndPath[commitToCheck.hash + "::" + deletion];
                // Update file record if file was created by this commit
                if (fileFound) {
                    var fileList = filesDeletedByCommitId[parentCommit.id] || [];
                    fileList.push(fileFound.id);
                    filesDeletedByCommitId[parentCommit.id] = fileList;
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
    // Format updates
    var filesUpdatesKeys = [];
    var filesUpdatesValues = [];
    bb.flow.for(filesDeletedByCommitId, function (commitId, filesIds) {
        var filesIdsChunk = bb.array.chunks(filesIds, function (idx) {
            return idx % 100 == 0;
        });
        bb.flow.for(filesIdsChunk, function (idx, filesIds) {
            filesUpdatesKeys.push(filesIds);
            filesUpdatesValues.push({
                "del_git_commit_id": commitId,
            });
        });
    });
    // Update files using update dictionary
    await bb.database.update("git_file", "id", filesUpdatesKeys, filesUpdatesValues);
    // Return updateds
    return filesUpdatesKeys;
};
