
var lookup = require("../lookup");

var bb = require("../../bb");

module.exports = async function (repository, authorsByName, commitsByHash, commitsList) {
    // Count files not found
    var notFoundFiles = 0;
    // List file changes paths found
    var commitsChangesPaths = {};
    bb.flow.for(commitsList, function (idx, commit) {
        bb.flow.for(commit.changes, function (idx, change) {
            commitsChangesPaths[change.path] = true;
        });
    });
    // Lookup all files changed
    var filesByPath = await lookup.files.byPath(repository.id, bb.dict.keys(commitsChangesPaths));
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
        var author = authorsByName[commit.author];
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
                notFoundFiles++;
                //console.log("Could not find files from path", change.path);
                return; // Continue loop
            }
            bb.flow.for(filesList, function (idx, file) {
                // If file was alive at commit time
                if (file.add_git_commit_time <= parentCommit.time) {
                    if (file.del_git_commit_time == null || file.del_git_commit_time >= parentCommit.time) {
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
                    }
                }
            });
        });
    });
    // Do insert all changes (ignore already inserted ones)
    return await bb.database.insert("git_change", insertedChanges, "ignore");
};
