
var lookup = require("../lookup");

var bb = require("../../bb");

module.exports = async function (repository, authorsBySignatures, commitsByHash, commitsList) {
    // List file changes paths found
    var commitsChangesPaths = {};
    bb.flow.for(commitsList, function (idx, commit) {
        bb.flow.for(commit.changes, function (idx, change) {
            commitsChangesPaths[change.path] = true;
        });
    });
    // Lookup all files changed
    var filesByPath = await lookup.files.byPaths(repository.id, bb.dict.keys(commitsChangesPaths));
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
            // Lookup file changed by path
            var filesList = filesByPath[change.path];
            // If could not find files from path
            if (!filesList) {
                console.log("Could not find files from path", change.path);
                return; // Continue loop
            }
            // Find the correct file that was changed
            var foundFile = null;
            bb.flow.for(filesList, function (idx, file) {
                // If file was alive at commit time
                if (file.add_git_commit_time <= parentCommit.time) {
                    if (file.del_git_commit_time == null || file.del_git_commit_time > parentCommit.time) {
                        // If the file was already found, something fishy is going on
                        if (foundFile != null) {
                            console.log("Duplicate file found for", parentCommit.hash, change.path);
                            return; // Continue loop
                        }
                        // Insert change datas
                        insertedChanges.push({
                            "git_repo_id": repository.id,
                            "git_commit_id": parentCommit.id,
                            "git_author_id": author.id,
                            "git_file_id": file.id,
                            "additions": change.additions,
                            "deletions": change.deletions,
                            "changes": change.total,
                            "binary": +change.binary,
                        });
                        foundFile = file;
                    }
                }
            });
        });
    });
    // Do insert all changes (ignore already inserted ones)
    await bb.database.insert("git_change", insertedChanges, "ignore");
    // Return inserteds
    return insertedChanges;
};
