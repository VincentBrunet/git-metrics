
var lookup = require("../lookup");

var bb = require("../../bb");

var thisFind = require("./_find");

module.exports = async function (context) {
    // List file updates to be applied
    var filesDeletedByCommitId = {};
    bb.flow.for(context.parsed.commits, function (idx, parsedCommit) {
        // Lookup synced commit
        var syncedCommit = context.synced.commits[parsedCommit.hash];
        // If synced commit not found
        if (!syncedCommit) {
            console.log("Could not find synced commit", parsedCommit.hash);
            return; // Continue loop
        }
        // List all paths to be marked as deleted
        var commitDeletions = [];
        bb.flow.for(parsedCommit.deletions, function (idx, deletion) {
            commitDeletions.push(deletion);
        });
        bb.flow.for(parsedCommit.renames, function (idx, rename) {
            commitDeletions.push(rename.before);
        });
        // For every deleted paths, lookup their associated files
        bb.flow.for(commitDeletions, function (idx, deletion) {
            // Lookup files
            var files = thisFindFiles(context, syncedCommit.hash, deletion);
            bb.flow.for(files, function (idx, file) {
                if (filesDeletedByCommitId[syncedCommit.id] === undefined) {
                    filesDeletedByCommitId[syncedCommit.id] = [];
                }
                filesDeletedByCommitId[syncedCommit.id].push(file.id);
            });
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
