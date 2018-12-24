
var bb = require("../../bb");

module.exports = async function (context) {
    // List all files found for insertion
    var insertedFiles = [];
    bb.flow.for(context.parsed.commits, function (idx, parsedCommit) {
        // Lookup synced commit
        var syncedCommit = context.synced.commits[parsedCommit.hash];
        // If we could not find synced commit
        if (!syncedCommit) {
            console.log("Could not find synced commit", parsedCommit.hash);
            return; // Continue loop
        }
        // List all added path by this commit
        var addedPaths = [];
        bb.flow.for(parsedCommit.additions, function (idx, addition) {
            addedPaths.push(addition);
        });
        bb.flow.for(parsedCommit.renames, function (idx, rename) {
            addedPaths.push(rename.after);
        });
        // Insert all added path
        bb.flow.for(addedPaths, function (idx, path) {
            // Insert added path
            insertedFiles.push({
                "git_repo_id": context.synced.repository.id,
                "add_git_commit_id": syncedCommit.id,
                "del_git_commit_id": null,
                "path": path,
            });
        });
    });
    // Insert all found files
    await bb.database.insert("git_file", insertedFiles, "ignore");
    // Lookup all files changed
    var files = await lookup.files.byPaths(context.synced.repository.id, bb.dict.keys(context.parsed.paths));
    // Index files by commit hash and path
    context.synced.files = bb.array.indexBy(files, function (file) {
        return file.add_git_commit_hash + "::" + file.path;
    });
    // Return inserteds
    return insertedFiles;
};
