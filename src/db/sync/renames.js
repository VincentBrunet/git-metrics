
var bb = require("../../bb");

module.exports = async function (context) {
    // Lookup repository
    var syncedRepository = context.synced.repository;
    // List all files found for rename
    var insertedRenames = [];
    bb.flow.for(context.parsed.commits, function (idx, parsedCommit) {
        // Lookup synced commit
        var syncedCommit = context.synced.commits[parsedCommit.hash];
        // If we could not find synced commit
        if (!syncedCommit) {
            console.log("Could not find synced commit", parsedCommit.hash);
            return; // Continue loop
        }
        // Insert renames
        bb.flow.for(parsedCommit.renames, function (idx, rename) {
            // Lookup synced file before
            var syncedFileBefore = context.synced.files[rename.before];
            // If we could not find synced file before
            if (!syncedFileBefore) {
                console.log("Could not find synced file before", rename.before);
                return; // Continue loop
            }
            // Lookup synced file after
            var syncedFileAfter = context.synced.files[rename.after];
            // If we could not find synced file after
            if (!syncedFileAfter) {
                console.log("Could not find synced file after", rename.after);
                return; // Continue loop
            }
            // Ready
            insertedRenames.push({
                "git_repository_id": syncedRepository.id,
                "git_commit_id": syncedCommit.id,
                "git_file_id_before": syncedFileBefore.id,
                "git_file_id_after": syncedFileAfter.id,
            });
        });
    });
    // Insert all found files
    await bb.database.insert("git_rename", insertedRenames, "ignore");
    // Return inserteds
    return insertedRenames;
};
