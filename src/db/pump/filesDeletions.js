
var lookup = require("../lookup");

var bb = require("../../bb");

module.exports = async function (repository, commitsByHash, commitsList) {
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
    var filesByPaths = await lookup.files.byPaths(repository.id, bb.dict.keys(commitsFilesDeletions));
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
            // Lookup files from path
            var filesList = filesByPaths[deletion];
            // If could not find files from path
            if (!filesList) {
                console.log("Could not find file for path", deletion);
                return; // Continue loop
            }
            // Find the best file
            var bestFile = null;
            bb.flow.for(filesList, function (idx, file) {
                // If path deletion belongs to this file (not already deleted and stuff)
                if (file.add_git_commit_time <= parentCommit.time) {
                    if (file.del_git_commit_time == null || file.del_git_commit_time >= parentCommit.time) {
                        if (bestFile == null || bestFile.add_git_commit_time < file.add_git_commit_time) {
                            bestFile = file;
                        }
                    }
                }
            });
            // If could not find valid file from path
            if (!bestFile) {
                console.log("Could not find valid file for path", deletion);
                return; // Continue loop
            }
            // Update file record
            var fileList = filesDeletedByCommitId[parentCommit.id] || [];
            fileList.push(bestFile.id);
            filesDeletedByCommitId[parentCommit.id] = fileList;
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