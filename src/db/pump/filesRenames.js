
var lookup = require("../lookup");

var bb = require("../../bb");

module.exports = async function (repository, commitsByHash, commitsList) {
    // Count files not found
    var notFoundFiles = 0;
    // List renamed commits files paths
    var filesRenamesPaths = {};
    bb.flow.for(commitsList, function (idx, commit) {
        bb.flow.for(commit.renames, function (idx, rename) {
            filesRenamesPaths[rename.before] = true;
            filesRenamesPaths[rename.after] = true;
        });
    });
    // Lookup all files renamed
    var filesByPath = lookup.files.byPaths(repository.id, bb.dict.keys(filesRenamesPaths));
    // List all rename instances to be created
    var renamesInserted = [];
    bb.flow.for(commitsList, function (idx, commit) {
        // Lookup parent commit
        var parentCommit = commitsByHash[commit.hash];
        if (!parentCommit) {
            console.log("Could not find parent commit", commit.hash);
            return; // Continue looping
        }
        // Loop over all renames of commit
        bb.flow.for(commit.renames, function (idx, rename) {
            // Lookup file after rename
            var fileAfter = undefined;
            var filesAfter = filesByPath[rename.after];
            bb.flow.for(filesAfter, function (idx, file) {
                if (file.add_git_commit_id == parentCommit.id) {
                    fileAfter = file;
                }
            });
            // If we could not find file after rename
            if (!fileAfter) {
                console.log("Could not find file after rename", rename.after);
                return; // Continue loop
            }
            // Lookup file before rename
            var fileBefore = undefined;
            var filesBefore = filesByPath[rename.before];
            bb.flow.for(filesBefore, function (idx, file) {
                if (file.del_git_commit_id == parentCommit.id) {
                    fileBefore = file;
                }
            });
            // If we could not find file before rename
            if (!fileBefore) {
                notFoundFiles++;
                //console.log("Could not find file before rename", rename.before);
                return; // Continue loop
            }
            // Insert rename instance when everything is found
            renamesInserted.push({
                "git_repo_id": repository.id,
                "git_commit_id": parentCommit.id,
                "before_git_file_id": fileBefore.id,
                "after_git_file_id": fileAfter.id,
            });
        });
    });
    // Insert all rename previously found
    return await bb.database.insert("git_rename", renamesInserted, "ignore");
};
