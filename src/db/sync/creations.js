
var bb = require("../../bb");

module.exports = async function (context) {
    // Lookup repository
    var syncedRepository = context.synced.repository;
    // List all files found for creation
    var insertedCreations = [];
    bb.flow.for(context.parsed.commits, function (idx, parsedCommit) {
        // Lookup synced commit
        var syncedCommit = context.synced.commits[parsedCommit.hash];
        // If we could not find synced commit
        if (!syncedCommit) {
            console.log("Could not find synced commit", parsedCommit.hash);
            return; // Continue loop
        }
        // All paths needed
        var paths = [];
        bb.flow.for(parsedCommit.creations, function (idx, path) {
            paths.push(path);
        });
        bb.flow.for(parsedCommit.renames, function (idx, rename) {
            paths.push(rename.after);
        });
        // Insert creations
        bb.flow.for(paths, function (idx, path) {
            // Lookup synced file
            var syncedFile = context.synced.files[path];
            // If we could not find synced file
            if (!syncedFile) {
                console.log("Could not find synced file", path);
                return; // Continue loop
            }
            // Ready for insertion
            insertedCreations.push({
                "git_repository_id": syncedRepository.id,
                "git_commit_id": syncedCommit.id,
                "git_file_id": syncedFile.id,
            });
        });
    });
    // Insert all found files
    await bb.database.insert("git_creation", insertedCreations, "ignore");
    // Return inserteds
    return insertedCreations;
};
