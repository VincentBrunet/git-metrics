
var lookup = require("../lookup");

var bb = require("../../bb");

module.exports = async function (repository, commitsByHash, commitsList) {
    // List all files found for insertion
    var filesInserted = [];
    bb.flow.for(commitsList, function (idx, commit) {
        // Lookup parent commit
        var parentCommit = commitsByHash[commit.hash];
        // If we could not find parent commit
        if (!parentCommit) {
            console.log("Could not find parent commit", commit.hash);
            return; // Continue loop
        }
        // List all added path by this commit
        var addedPaths = [];
        bb.flow.for(commit.additions, function (idx, addition) {
            addedPaths.push(addition);
        });
        bb.flow.for(commit.renames, function (idx, rename) {
            addedPaths.push(rename.after);
        });
        // Insert all added path
        bb.flow.for(addedPaths, function (idx, path) {
            // Insert added path
            filesInserted.push({
                "git_repo_id": repository.id,
                "add_git_commit_id": parentCommit.id,
                "del_git_commit_id": null,
                "path": path,
            });
        });
    });
    // Insert all found files
    return await bb.database.insert("git_file", filesInserted, "ignore");
};
