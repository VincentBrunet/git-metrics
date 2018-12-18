
var bb = require("../../../bb");

module.exports = async function (repositoryId, filesPaths) {
    // Batch file read
    var batch = bb.database.batch("git_file", filesPaths, function (query, chunk) {
        query.leftJoin("git_commit as add_git_commit", "git_file.add_git_commit_id", "add_git_commit.id");
        query.leftJoin("git_commit as del_git_commit", "git_file.del_git_commit_id", "del_git_commit.id");
        query.where("git_file.git_repo_id", repositoryId);
        query.whereIn("path", chunk);
        query.selectAs({
            "git_file.id": "id",
            "git_file.path": "path",
            "add_git_commit.id": "add_git_commit_id",
            "add_git_commit.time": "add_git_commit_time",
            "del_git_commit.id": "del_git_commit_id",
            "del_git_commit.time": "del_git_commit_time",
        });
    });
    // Run all batches query and merge results
    var files = await bb.database.execute(batch);
    // Index files by path
    var filesByPath = {};
    bb.flow.for(files, function (idx, file) {
        var filesList = filesByPath[file.path] || [];
        filesList.push(file);
        filesByPath[file.path] = filesList;
    });
    // Done, transfer files indexed by path
    return filesByPath;
};
