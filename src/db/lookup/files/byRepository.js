
var bb = require("../../../bb");

module.exports = async function (repositoryId) {
    // Batch file read
    var query = bb.database.query("git_file");
    query.leftJoin("git_commit as add_git_commit", "git_file.add_git_commit_id", "add_git_commit.id");
    query.leftJoin("git_commit as del_git_commit", "git_file.del_git_commit_id", "del_git_commit.id");
    query.where("git_file.git_repo_id", repositoryId);
    query.selectAs({
        "git_file.id": "id",
        "git_file.path": "path",
        "add_git_commit.id": "add_git_commit_id",
        "add_git_commit.time": "add_git_commit_time",
        "add_git_commit.hash": "add_git_commit_hash",
        "del_git_commit.id": "del_git_commit_id",
        "del_git_commit.time": "del_git_commit_time",
        "del_git_commit.hash": "del_git_commit_hash",
    });
    // Run all batches query and merge results
    var files = await bb.database.execute(query);
    // Done
    return files;
};
