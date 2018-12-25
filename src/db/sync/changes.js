
var bb = require("../../bb");

module.exports = async function (context) {
    // Lookup Repository
    var syncedRepository = context.synced.repository;
    // List changes to be applied to different paths
    var insertedChanges = [];
    bb.flow.for(context.parsed.commits, function (idx, parsedCommit) {
        // Lookup commit
        var syncedCommit = context.synced.commits[parsedCommit.hash];
        // If we could not find commit
        if (!syncedCommit) {
            console.log("Could not find synced commit", parsedCommit.hash);
            return; // Continue loop
        }
        // Loop over all commit changes
        bb.flow.for(parsedCommit.changes, function (idx, parsedChange) {
            // Lookup file
            var syncedFile = context.synced.files[parsedChange.path];
            // If we could not find file
            if (!syncedFile) {
                console.log("Could not find synced file", parsedChange.path);
                return; // Continue loop
            }
            // Insert change datas
            insertedChanges.push({
                "git_repository_id": syncedRepository.id,
                "git_commit_id": syncedCommit.id,
                "git_file_id": syncedFile.id,
                "insert": parsedChange.insert,
                "remove": parsedChange.remove,
                "total": parsedChange.total,
                "binary": +parsedChange.binary,
            });
        });
    });
    // Do insert all changes (ignore already inserted ones)
    await bb.database.insert("git_change", insertedChanges, "ignore");
    // Return inserteds
    return insertedChanges;
};
